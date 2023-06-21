from ..types import NetworkData
from .pf_algorithms import Gauss_Seidel, Newton_Raphson, Fast_Decoupled

class Network:
    def __init__(self, network_data: NetworkData, is_per_unit, base_voltage, base_power, iter_limit, pf_method) -> None:
        self.bus_id_to_bus_values = network_data.bus_properties
        self.line_id_to_line_values = network_data.line_properties
        self.line_ids_connected_to_bus_id = network_data.network.buses
        self.bus_ids_connected_to_line_id = network_data.network.lines
        self.is_per_unit = is_per_unit
        self.base_voltage = base_voltage
        self.base_power = base_power
        self.pf_method = pf_method
        self.iter_limit = iter_limit
        self.bus_id_to_ordering = { bus_id: count for count, bus_id in enumerate(self.network["buses"].keys()) }
        self.load_bus_ids = []
        self.generator_bus_ids = []
        self.slack_bus_ids = []
        for bus_id, bus_values in network_data.bus_properties:
            if bus_values.type == "load_bus":
                self.load_bus_ids.append(bus_id)
            elif bus_values.type == "generator_bus":
                self.generator_bus_ids.append(bus_id)
            else:
                self.slack_bus_ids.append(bus_id)
    
    def create_bus_admittance_matrix(self):
        num_buses = len(self.bus_values)

        y_bus = [[0 for i in range(num_buses)] for i in range(num_buses)]

        for bus_id, line_ids in self.network["buses"].items():
            # first bus ordering
            position = self.bus_id_to_ordering[bus_id]
            accumulator = 0

            for line_id in line_ids:
                line_values = self.line_values[line_id]

                line_admittance = 1 / complex(line_values.resistance, line_values.reactance)

                # Yii
                accumulator += line_admittance

                # Yij
                ## get second bus ordering
                bus1_id, bus2_id = self.network.lines[line_id]

                if (bus1_id == bus_id):
                    second_position = self.bus_id_to_ordering[bus2_id]
                else:
                    second_position = self.bus_id_to_ordering[bus1_id]

                y_bus[position][second_position] = -1 * line_admittance
                y_bus[second_position][position] = -1 * line_admittance

            y_bus[position][position] = accumulator
        
        self.y_bus = y_bus

    def convert_values_to_pu(self):
        for bus_id in self.bus_values.keys():
            bus_values = self.bus_values[bus_id]

            if bus_values.type == "slack_bus":
              bus_values.voltage /= self.base_voltage
            if bus_values.type == "generator_bus":
              bus_values.real_power /= self.base_power
              bus_values.voltage /= self.base_voltage
            if bus_values.type == "load_bus":
              bus_values.real_power /= self.base_power
              bus_values.reactive_power /= self.base_power

        for line_id in self.line_values.keys():
            line_values = self.line_values[line_id]
            base_impedance = (self.base_voltage ** 2) / self.base_power

            line_values[line_id].resistance /= base_impedance
            line_values[line_id].reactance /= base_impedance
    
    def calc_line_currents(self):
        num_lines = len(self.lines)
        line_currents = np.zeros(num_lines, dtype=np.complex128)

        # Calculate the line currents
        for i, line in enumerate(self.lines):
            from_bus = self.buses[line.from_bus_idx]
            to_bus = self.buses[line.to_bus_idx]

            # Calculate the voltage difference between the buses
            delta_v = from_bus.voltage * np.exp(1j * from_bus.angle) - to_bus.voltage * np.exp(1j * to_bus.angle)

            # Calculate the line current
            line_currents[i] = delta_v / line.impedance

        return line_currents
    
    def calc_power_flow(self):
            if self.is_per_unit:
                self.convert_values_to_pu()

            self.create_bus_admittance_matrix()
            
            if self.pf_method == "gs":
                Gauss_Seidel(self)
            elif self.pf_method == "nr":
                Newton_Raphson(self)
            else:
                Fast_Decoupled(self)

            self.calc_line_currents()