import https from "https";
import { HttpError, JsonParseError } from "./errors.js";

export function httpsGet(url: string) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(
              new HttpError(url, res.statusCode!, data)
            );
          }
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(
              new JsonParseError(url, data, err instanceof Error ? err.message : String(err))
            );
          }
        });
      })
      .on("error", reject);
  });
}
