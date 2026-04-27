# 🗃️ MariaDB Database

The server runs inside a **Linux Container (LXC)**. Unlike a Virtual Machine (VM), an LXC shares the host’s kernel (the system’s “brain”) instead of emulating hardware. Because it does not run its own full operating system stack, it consumes significantly less RAM and CPU overhead.

This allows more system resources to be allocated to database operations rather than virtualization overhead.

A **CT template** in Proxmox is a pre-configured base operating system image used to quickly create Linux containers. Instead of installing an OS manually, the template allows fast and consistent deployments.

**Debian 12 (Bookworm)** was selected for its stable release model, which prioritizes long-term reliability and security updates over experimental features. Its minimal default installation reduces potential security risks and keeps the server lightweight and efficient.

