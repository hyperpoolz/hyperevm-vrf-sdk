import https from "https";

export function httpsGet(url: string) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(
              new Error(`HTTP ${res.statusCode} from ${url}: ${data}`)
            );
          }
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(
              new Error(`Invalid JSON from ${url}: ${data.slice(0, 200)}`)
            );
          }
        });
      })
      .on("error", reject);
  });
}
