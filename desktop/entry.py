import os
from urllib.parse import urlparse


def main() -> None:
    os.environ.setdefault("DESKTOP_MODE", "true")

    base_url = os.environ.get("BASE_URL", "http://127.0.0.1:8081")
    parsed = urlparse(base_url)
    port = parsed.port or 8081

    from granian import Granian

    server = Granian(
        target="app.main:app",
        address="127.0.0.1",
        port=port,
        interface="asgi",
        workers=1,
    )
    server.serve()


if __name__ == "__main__":
    main()
