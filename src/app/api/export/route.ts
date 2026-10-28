import { buildExport, exportFileName } from "@/lib/data-export";
import { contentDisposition } from "@/lib/file-name";
import { prisma } from "@/lib/prisma";
import { route } from "@/lib/route";

/**
 * Downloads everything as one JSON file (E10-4, SET-10), with the API key
 * in plain text only for `?apiKey=1`.
 */
export const GET = route(async (request) => {
  const now = new Date();
  const data = await buildExport(prisma, { includeApiKey: request.nextUrl.searchParams.get("apiKey") === "1", now });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": contentDisposition(exportFileName(now)),
    },
  });
});
