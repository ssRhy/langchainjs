"""基于百度千帆API的简单LangChain chatbot"""

import os
from langchain_community.chat_models import QianfanChatEndpoint
from langchain_core.messages import HumanMessage, AIMessage
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate

# 设置API密钥
os.environ["QIANFAN_AK"] = "pwQpMsjXhskfjGYBGxtqw6T3"
os.environ["QIANFAN_SK"] = "vbvn36XQzfuGBufTlYgmghFF2Nk3lgyK"

def main():
    # 初始化聊天模型
    chat = QianfanChatEndpoint(streaming=True)
    
    # 创建一个简单的聊天提示模板
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个有帮助的AI助手，基于百度千帆API。"),
        ("human", "{input}")
    ])
    
    # 创建LLMChain
    chain = LLMChain(llm=chat, prompt=prompt)
    
    print("欢迎使用百度千帆AI聊天机器人! 输入'退出'结束对话。")
    
    # 开始交互式对话
    while True:
        user_input = input("用户: ")
        if user_input.lower() in ['退出', 'quit', 'exit']:
            print("谢谢使用，再见!")
            break
        
        # 调用API获取回复
        try:
            response = chain.invoke({"input": user_input})
            print(f"AI: {response['text']}")
        except Exception as e:
            print(f"发生错误: {e}")

if __name__ == "__main__":
    main()