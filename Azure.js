import { AzureChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";

import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

import { DynamicStructuredTool } from "@langchain/core/tools";
import { WebBrowser } from "langchain/tools/webbrowser";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { z } from "zod";

// 获取当前模块路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置 Azure OpenAI
const llm = new AzureChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
  azureOpenAIApiVersion: "2024-02-15-preview",
});

// ==================== 代码生成 Agent ====================
const codeGenerationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一名专业的Three.js代码生成专家，严格遵循以下规则：
1. 生成完整可运行的HTML文件
2. 包含场景、相机、渲染器、光源和动画循环
3. 使用CDN引入three.js库（版本r158）
4. 用户可调整的参数用注释标注
5. 不要任何解释文字
6. 使用"- camera.position.z: 控制视角距离\n" 格式
7. 使用"- camera.position.y: 控制视角高度\n" 格式
8. 使用"- camera.position.x: 控制视角水平位置\n" 格式
9. 使用"- camera.position.y: 控制视角高度\n" 格式
10. 使用"- camera.position.z: 控制视角距离\n" 格式
11. 使用"- cdn: 控制three.js库版本\n" 格式
`,
  ],
  ["human", "{input}"],
]);

const codeGenerationChain = codeGenerationPrompt.pipe(llm);

// ==================== 代码执行 Agent ====================
const tools = [
  new DynamicStructuredTool({
    name: "save_and_preview_code",
    description: "将生成的Three.js代码保存为HTML文件并在浏览器中打开预览",
    schema: z.object({
      code: z.string().describe("需要保存的完整HTML代码"),
      filename: z.string().default("output.html").describe("保存文件名"),
    }),
    async func({ code, filename }) {
      try {
        const filePath = path.join(__dirname, filename);
        await fs.promises.writeFile(filePath, code);

        // 自动打开浏览器
        const opener = process.platform === "win32" ? "start" : "open";
        exec(`${opener} ${filePath}`);

        return `代码已保存至 ${filePath} 并自动打开预览`;
      } catch (error) {
        return `保存失败: ${error.message}`;
      }
    },
  }),
//检查agent
  new DynamicStructuredTool({
    name: "validate_threejs_code",
    description: "验证Three.js代码完整性",
    schema: z.object({
      code: z.string().describe("需要验证的代码内容"),
    }),
    func: async ({ code }) => {
      const requiredElements = [
        "THREE.Scene",
        "PerspectiveCamera",
        "WebGLRenderer",
        "animate()",
        "requestAnimationFrame",
      ];

      const missing = requiredElements.filter((el) => !code.includes(el));
      return missing.length > 0
        ? `缺少关键元素: ${missing.join(", ")}`
        : "代码验证通过";
    },
  }),
];

const executionAgentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一个代码执行协调Agent，负责：
1. 调用验证工具检查代码完整性
2. 自动保存并通过浏览器预览有效代码
3. 将问题反馈给生成Agent`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const executionAgent = createToolCallingAgent({
  llm,
  tools,
  prompt: executionAgentPrompt,
});

const executionAgentExecutor = new AgentExecutor({
  agent: executionAgent,
  tools,
  verbose: true,
});

// ==================== 主流程 Agent ====================
async function mainAgent(userInput) {
  // 步骤1: 生成代码
  const generationResult = await codeGenerationChain.invoke({
    input: userInput,
  });
  const generatedCode = generationResult.content;

  // 步骤2: 执行验证和预览
  const executionResult = await executionAgentExecutor.invoke({
    input: `验证并预览以下代码：\n${generatedCode}`,
    chat_history: [],
  });

  // 步骤3: 处理反馈
  if (executionResult.output.includes("验证通过")) {
    return {
      status: "success",
      code: generatedCode,
      preview: executionResult.output,
    };
  } else {
    return {
      status: "needs_revision",
      feedback: executionResult.output,
      original_code: generatedCode,
    };
  }
}

// ==================== 交互界面 ====================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function interactiveLoop() {
  console.log("Three.js 智能生成系统 (输入 exit 退出)");

  const ask = () => {
    rl.question("\n请输入物体描述：", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      const result = await mainAgent(input);

      if (result.status === "success") {
        console.log("\n 生成成功自动打开浏览器预览...");
      } else {
        console.log("\n 需要修正：", result.feedback);
      }

      ask();
    });
  };

  ask();
}

// 启动系统
interactiveLoop();
