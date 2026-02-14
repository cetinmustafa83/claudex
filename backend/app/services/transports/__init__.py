from app.services.transports.docker import DockerSandboxTransport
from app.services.transports.e2b import E2BSandboxTransport
from app.services.transports.host import HostSandboxTransport
from app.services.transports.modal import ModalSandboxTransport

SandboxTransport = (
    DockerSandboxTransport
    | E2BSandboxTransport
    | HostSandboxTransport
    | ModalSandboxTransport
)

__all__ = [
    "DockerSandboxTransport",
    "E2BSandboxTransport",
    "HostSandboxTransport",
    "ModalSandboxTransport",
    "SandboxTransport",
]
