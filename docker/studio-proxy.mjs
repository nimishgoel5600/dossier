// Prisma Studio only listens on 127.0.0.1 (hard-coded in Prisma 7), which
// Docker's published ports can't reach. This forwards the container's network
// address to it, so http://localhost:5555 on the host works. See the studio
// service in compose.yml.
import net from "node:net";
import os from "node:os";

const port = 5555;

net
  .createServer((client) => {
    const studio = net.connect(port, "127.0.0.1");
    client.pipe(studio).pipe(client);
    client.on("error", () => studio.destroy());
    studio.on("error", () => client.destroy());
  })
  // Docker maps the container's hostname to its network address. Binding that
  // instead of 0.0.0.0 leaves 127.0.0.1:5555 free for Studio, so the URL
  // Studio prints stays correct.
  .listen(port, os.hostname());
