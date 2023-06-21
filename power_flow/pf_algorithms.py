import numpy as np

def Gauss_Seidel(network_data):
    iterations = 0
    min_error = 10 ** -3
    error = -1 * np.Infinity
    
    while min_error < error and iterations <  network_data.iter_limit:
        # should do all pq first
        for bus_id, position in network_data.bus_id_to_ordering.items():
            bus_values = network_data.bus_values[bus_id]
            yii = network_data.y_bus[position][position]

            if bus_values.type == "load_bus":
                current_voltage = bus_values.voltage_guess
                yv_sum = 0
                # calc yv_sum
                for inner_bus_id, inner_position in network_data.bus_id_to_ordering.items():
                    if inner_bus_id == bus_id:
                        continue
                    inner_bus_values = network_data.bus_values[inner_position]
                    bus_voltage = inner_bus_values.voltage if inner_bus_values.type == "generator_bus" else inner_bus_values.voltage_guess
                    yv_sum += network_data.y_bus[position][inner_position] * bus_voltage
                
                new_voltage = (1 / yii) * ((complex(bus_values.real_power, -1 * bus_values.reactive_power) / current_voltage.conjugate()) - yv_sum)
                new_error = np.abs(current_voltage - new_voltage)
                error = new_error if new_error > error else error
                bus_values.voltage_guess = new_voltage
            
            if bus_values.type == "generator_bus":
                current_voltage = bus_values.voltage
                y_sum = 0
                yv_sum = 0

                for inner_bus_id, inner_position in network_data.bus_id_to_ordering.items():
                    if inner_bus_id == bus_id:
                        continue
                    inner_bus_values = network_data.bus_values[inner_position]
                    bus_voltage = inner_bus_values.voltage if inner_bus_values.type == "generator_bus" else inner_bus_values.voltage_guess
                    y_sum += -1 * network_data.y_bus[bus_id][inner_position]
                    yv_sum += -1 * network_data.y_bus[position][inner_position] * bus_voltage

                reactive_power = -1 * ((current_voltage.conjugate() * (current_voltage * y_sum - yv_sum)).imag)

                fake_voltage = (1 / y_sum) * ((complex(bus_values.real_power, -1 * reactive_power) / current_voltage.conjugate()) - yv_sum)
                new_voltage = complex(np.sqrt(np.square(current_voltage) - np.square(fake_voltage.real)), fake_voltage.imag)
                new_error = np.abs(current_voltage - new_voltage)
                error = new_error if new_error > error else error
                bus_values.voltage = new_voltage
          
        iterations += 1

def Newton_Raphson(network_data):
    pass

def Fast_Decoupled(network_data):
    iterations = 0
    min_error = 10 ** -3
    error = -1 * np.Infinity
    load_bus_ids = [bus_id for i, (bus_id, position) in enumerate(network_data.bus_id_to_ordering) if network_data.bus_values[bus_id].type == "load_bus"]
    generator_bus_ids = [bus_id for i, (bus_id, position) in enumerate(network_data.bus_id_to_ordering) if network_data.bus_values[bus_id].type == "generator_bus"]
    no_unknown_voltage = len(load_bus_ids)
    no_unknown_phase_angle = no_unknown_voltage + len(generator_bus_ids)

    b_voltage = []
    b_phase_angle = []
    
    for _ in range(no_unknown_voltage):
        b_voltage.append([])

    for _ in range(no_unknown_phase_angle):
        b_phase_angle.append([])

    for i, (bus_id, position) in enumerate(network_data.bus_id_to_ordering):
        bus_values = network_data.bus_values[bus_id]
        for j, (inner_bus_id, inner_position) in enumerate(network_data.bus_id_to_ordering):
            inner_bus_values = network_data.bus_values[inner_bus_id]
            if bus_values.type == "load_bus":
                if inner_bus_values.type == "load_bus":
                    b_voltage[j][i] = network_data.y_bus[inner_position][position]
                    b_voltage[i][j] = network_data.y_bus[position][inner_position]
                    b_phase_angle[j][i] = network_data.y_bus[inner_position][position]
                    b_phase_angle[i][j] = network_data.y_bus[position][inner_position]
                if inner_bus_values.type == "generator_bus":
                    b_phase_angle[j][i] = network_data.y_bus[inner_position][position]
                    b_phase_angle[i][j] = network_data.y_bus[position][inner_position]
              
            if bus_values.type == "generator_bus":
                if inner_bus_values.type == "load_bus":
                    b_phase_angle[j][i] = network_data.y_bus[inner_position][position]
                    b_phase_angle[i][j] = network_data.y_bus[position][inner_position]
                if inner_bus_values.type == "generator_bus":
                    b_phase_angle[j][i] = network_data.y_bus[inner_position][position]
                    b_phase_angle[i][j] = network_data.y_bus[position][inner_position]

    while min_error < error and iterations < network_data.iter_limit:
        vector_voltage = []
        vector_phase_angle = []

        for _ in range(no_unknown_voltage):
            vector_voltage.append(None)

        for _ in range(no_unknown_phase_angle):
            vector_phase_angle.append(None)
        
        for i, (bus_id, position) in enumerate(network_data.bus_id_to_ordering):
            bus_values = network_data.bus_values[bus_id]
            real_power_calc = 0
            reactive_power_calc = 0
            if bus_values.type == "load_bus":
                for j, (inner_bus_id, inner_position) in enumerate(network_data.bus_id_to_ordering):
                  if inner_bus_id == bus_id:
                        continue
                  inner_bus_values = network_data.bus_values[inner_bus_id]
                  current_voltage = bus_values.voltage_guess
                  current_phase_angle = np.arctan(current_voltage.imag / current_voltage.real)
                  inner_current_voltage = inner_bus_values.voltage if inner_bus_values.type == "generator_bus" else inner_bus_values.voltage_guess
                  inner_current_phase_angle = np.arctan(inner_current_voltage.imag / inner_current_voltage.real)
                  y_bus_angle = np.arctan(network_data.y_bus[i][j].imag / network_data.y_bus[i][j].real)
                  real_power_calc += current_voltage * inner_current_voltage * network_data.y_bus[i][j] * np.cos(y_bus_angle - current_phase_angle + inner_current_phase_angle)
                  reactive_power_calc += -1 * current_voltage * inner_current_voltage * network_data.y_bus[i][j] * np.sin(y_bus_angle - current_phase_angle + inner_current_phase_angle)
                real_power_mismatch = (bus_values.real_power - real_power_calc) / bus_values.voltage_guess
                reactive_power_mismatch = (bus_values.reactive_power - reactive_power_calc) / bus_values.voltage
                vector_voltage.append(reactive_power_mismatch)
                vector_phase_angle.append(real_power_mismatch)
            
            if bus_values.type == "generator_bus":
                for j, (inner_bus_id, inner_position) in enumerate(network_data.bus_id_to_ordering):
                  if inner_bus_id == bus_id:
                        continue
                  inner_bus_values = network_data.bus_values[inner_bus_id]
                  current_voltage = bus_values.voltage_guess
                  current_phase_angle = np.arctan(current_voltage.imag / current_voltage.real)
                  inner_current_voltage = inner_bus_values.voltage if inner_bus_values.type == "generator_bus" else inner_bus_values.voltage_guess
                  inner_current_phase_angle = np.arctan(inner_current_voltage.imag / inner_current_voltage.real)
                  y_bus_angle = np.arctan(network_data.y_bus[i][j].imag / network_data.y_bus[i][j].real)
                  real_power_calc += current_voltage * inner_current_voltage * network_data.y_bus[i][j] * np.cos(y_bus_angle - current_phase_angle + inner_current_phase_angle)
                real_power_mismatch = (bus_values.real_power - real_power_calc) / bus_values.voltage_guess
                vector_phase_angle.append(real_power_mismatch)
        
        phase_angle_mismatch = np.multiply((-1 * (b_phase_angle ** -1)), vector_phase_angle)
        voltage_mismatch = np.multiply((-1 * (b_voltage ** -1)), vector_voltage)

        error = np.max(phase_angle_mismatch, voltage_mismatch, error)

        for i, (bus_id, position) in enumerate(network_data.bus_id_to_ordering):
            bus_values = network_data.bus_values[bus_id]
            if bus_values.type == "load_bus":
                bus_values.voltage_guess += voltage_mismatch[position]
                bus_values.phase_angle_guess += phase_angle_mismatch[position]
            if bus_values.type == "generator_bus":
                bus_values.phase_angle_guess += phase_angle_mismatch[position]
        
        iterations += 1