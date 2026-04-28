from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np

def solve_route(locations, constraints):
    """
    Solves a basic TSP for given locations using OR-Tools.
    locations: list of (lat, lng)
    """
    # Create distance matrix (Manhattan distance for simplicity)
    def create_distance_matrix(locs):
        matrix = []
        for i in range(len(locs)):
            row = []
            for j in range(len(locs)):
                dist = abs(locs[i][0] - locs[j][0]) + abs(locs[i][1] - locs[j][1])
                row.append(int(dist * 1000)) # Scale to integer for OR-Tools
            matrix.append(row)
        return matrix

    data = {}
    data['distance_matrix'] = create_distance_matrix(locations)
    data['num_vehicles'] = 1
    data['depot'] = 0

    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']),
                                           data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)

    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        route = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        route.append(manager.IndexToNode(index))
        return route
    return None
