from io import BytesIO

from pandapower import io_utils, file_io
import pandapower as pp
import pandas as pd
from pandas import ExcelWriter
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response

from pf_types import NetworkData

app = FastAPI()

@app.post("/power_flow", response_class=Response)
def power_flow(convert_to_per_unit: bool, base_voltage: float, base_power: float, iter_limit: float, pf_method: str, network_data: NetworkData):
    if convert_to_per_unit:
        network = pp.create_empty_network(sn_mva=base_power)
    else:
        base_power = 100
        base_voltage = 10
        network = pp.create_empty_network(sn_mva=base_power)
        
    bus_id_to_index = {}
    line_id_to_index = {}

    for i, bus_id, in enumerate(network_data.network["buses"].keys()):
      bus_id_to_index[bus_id] = i
      bus = pp.create_bus(network, name=bus_id, index=i, type="b", vn_kv=base_voltage)
      bus_values = network_data.bus_properties[bus_id]

      if bus_values["type"] == "load_bus":
          if convert_to_per_unit:
            # take actual
            real_power = float(bus_values["real_power"])
            reactive_power = float(bus_values["reactive_power"])
          else:
            real_power = float(bus_values["real_power"]) * base_power
            reactive_power = float(bus_values["reactive_power"]) * base_power
          pp.create_load(network, bus, p_mw=real_power, q_mw=reactive_power)
      elif bus_values["type"] == "generator_bus":
          if convert_to_per_unit:
            # take actual
            real_power = float(bus_values["real_power"])
            # convert to pu
            voltage = float(bus_values["voltage"]) / base_voltage
          else:
            # convert to actual
            real_power = float(bus_values["real_power"]) * base_power
            # take pu
            voltage = float(bus_values["voltage"])
          pp.create_gen(network, bus, p_mw=real_power, vm_pu=voltage)
      else:
          if convert_to_per_unit:
            # convert to pu
            voltage = float(bus_values["voltage"]) / base_voltage
          else:
            # take pu
            voltage = float(bus_values["voltage"])
          pp.create_ext_grid(network, bus, vm_pu=voltage)

    for i, (line_id, bus_ids) in enumerate(network_data.network["lines"].items()):
        line_values = network_data.line_properties[line_id]
        if convert_to_per_unit:
            # take actual
            resistance = float(line_values["resistance"])
            reactance = float(line_values["reactance"])
        else:
            # convert to actual
            base_impedance = (base_voltage ** 2) / base_power
            resistance = float(line_values["resistance"]) * base_impedance
            reactance = float(line_values["reactance"]) * base_impedance
        
        line_id_to_index[line_id] = i
        from_bus_index = bus_id_to_index[bus_ids[0]]
        to_bus_index = bus_id_to_index[bus_ids[1]]
        pp.create_line_from_parameters(network, from_bus=from_bus_index, to_bus=to_bus_index, length_km=1, r_ohm_per_km = resistance, x_ohm_per_km = reactance, c_nf_per_km = 0, max_i_ka = 0, name=line_id, index=i)

    pp.runpp(network, calculate_voltage_angles=True, algorithm=pf_method, max_iteration=iter_limit)

    memory_store = BytesIO()

    with ExcelWriter(memory_store) as excel_wkbk:
      network.res_bus.to_excel(excel_wkbk, sheet_name="Bus Data")
      network.res_line.to_excel(excel_wkbk, sheet_name="Line Data")

    memory_store.seek(0)

    headers = {
        "Content-Disposition": 'attachment; filename="results.xlsx"',
        "Content-Type": "application/vnd.ms-excel",
    }

    return Response(content=memory_store.getvalue(), status_code=200, headers=headers)

@app.post("/file")
def file_pf(pf_method: str, iter_limit: float, file: UploadFile):
    xls = pd.read_excel(file.file, sheet_name=None, index_col=0, engine="openpyxl")

    try:
        net = io_utils.from_dict_of_dfs(xls)
    except:
        net = file_io._from_excel_old(xls)

    pp.runpp(net, calculate_voltage_angles=True, algorithm=pf_method, max_iteration=iter_limit)

    memory_store = BytesIO()

    with ExcelWriter(memory_store) as excel_wkbk:
      net.res_bus.to_excel(excel_wkbk, sheet_name="Bus Data")
      net.res_line.to_excel(excel_wkbk, sheet_name="Line Data")

    memory_store.seek(0)

    headers = {
        "Content-Disposition": 'attachment; filename="results.xlsx"',
        "Content-Type": "application/vnd.ms-excel",
    }

    return Response(content=memory_store.getvalue(), status_code=200, headers=headers)

    

app.mount("/", StaticFiles(directory="web", html=True))