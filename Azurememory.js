// yarn add @langchain/anthropic @langchain/community @upstash/redis

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatAnthropic } from "@langchain/anthropic";
import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";
// For demos, you can also use an in-memory store:
// import { ChatMessageHistory } from "langchain/stores/message/in_memory";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You're an assistant who's good at {ability}"],
  new MessagesPlaceholder("history"),
  ["human", "{question}"],
]);

const chain = prompt.pipe(new ChatAnthropic({}));

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (sessionId) =>
    new UpstashRedisChatMessageHistory({
      sessionId,
      config: {
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      },
    }),
  inputMessagesKey: "question",
  historyMessagesKey: "history",
});

const result = await chainWithHistory.invoke(
  {
    ability: "math",
    question: "What does cosine mean?",
  },
  {
    configurable: {
      sessionId: "some_string_identifying_a_user",
    },
  }
);

const result2 = await chainWithHistory.invoke(
  {
    ability: "math",
    question: "What's its inverse?",
  },
  {
    configurable: {
      sessionId: "some_string_identifying_a_user",
    },
  }
);
