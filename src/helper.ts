import axios from "axios";
import { resolve } from "path";
import colors from "colors";
import glob from "glob";
import COS from "cos-nodejs-sdk-v5";
import fs from "fs";
import p from "path";
export default function vitePluginTencentCos({
  region = "ap-shanghai",
  secretKey = "",
  secretId = "",
  bucket = "",
  path = "remote",
  remotePath = "/",
  regisCenter = "",
} ) {
  return {
    name: "vite-federation-helper",
    async closeBundle() {
      if (!remotePath.startsWith("/") || !remotePath.endsWith("/")) {
        console.error("remotePath必须以/开头,以/结尾");
        return;
      }

      path = resolve(process.cwd(), path);

      const cos = new COS({
        SecretKey: secretKey,
        SecretId: secretId,
      });

      const filePaths = await glob.sync(path + "/**/*");

      for (const filePath of filePaths) {
        const remoteFilePath = resolve(
          remotePath,
          filePath.replace(`${path}/`, "")
        );
        console.log(colors.yellow(`正在发布文件: ${remoteFilePath}`));
        await cos.sliceUploadFile({
          Bucket: bucket,
          Region: region,
          Key: remoteFilePath,
          FilePath: filePath,
        });
        console.log(colors.green(`成功发布文件: ${remoteFilePath}`));
      }
      console.log(colors.green("全部发布成功"));
      await axios
        .post(
          regisCenter,
          fs.readFileSync(p.resolve(process.cwd(), "micro.json"))
        )
        .catch((e) => {
          console.log(colors.red(`注册失败${e}`));
        });

      console.log(colors.blue("全部注册成功"));
    },
  };
}
