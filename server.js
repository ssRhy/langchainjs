import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { AzureChatOpenAI } from "@langchain/openai";

const app = express();
const server = createServer(app);
const io = new Server(server);

// 配置静态文件服务
app.use(express.static("public"));

// Three.js 代码生成逻辑（复用之前的Agent代码）
const llm = new AzureChatOpenAI({
  /* 配置参数 */
});

io.on("connection", (socket) => {
  console.log("用户已连接");

  socket.on("generate", async (prompt) => {
    try {
      const code = await generateThreeJsCode(prompt); // 调用之前的生成函数
      socket.emit("code_update", {
        code,
        status: "success",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });
});

server.listen(3000, () => {
  console.log("服务运行在 http://localhost:3000");
});
