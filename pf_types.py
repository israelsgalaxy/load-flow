from typing import TypedDict, Any

from pydantic import BaseModel

class Network(TypedDict):
    buses: dict[str, list[str]]
    lines: dict[str, list[str]]

class NetworkData(BaseModel):
    bus_properties: dict[str, Any]
    line_properties: dict[str, Any]
    network: Network
