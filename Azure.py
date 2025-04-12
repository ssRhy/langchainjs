import getpass
import os
from langchain_openai import AzureChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate

# Set Azure OpenAI API key if not already in environment
if "AZURE_OPENAI_API_KEY" not in os.environ:
    os.environ["AZURE_OPENAI_API_KEY"] = getpass.getpass(
        "Enter your AzureOpenAI API key: "
    )
# Set your Azure OpenAI endpoint URL
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://mctai.openai.azure.com/"

# Initialize Azure OpenAI language model
llm = AzureChatOpenAI(
    azure_deployment="gpt-4o",  # or your deployment name
    api_version="2024-02-15-preview",  # or your api version
    temperature=0.7,
    max_tokens=800,
    timeout=None,
    max_retries=2,
)

# Create prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant that can talk about any topic."),
    MessagesPlaceholder(variable_name="history"),
    HumanMessagePromptTemplate.from_template("{input}")
])

# Initialize memory
memory = ConversationBufferMemory(return_messages=True, memory_key="history")

# Create conversation chain
conversation = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    verbose=True
)

from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant that translates {input_language} to {output_language}.",
        ),
        ("human", "{input}"),
    ]
)

chain = prompt | llm
chain.invoke(
    {
        "input_language": "Chinese",
        "output_language": "Chinese",
        "input": "I love programming.",
    }
)

def main():
    print("欢迎使用 Azure OpenAI 聊天机器人! (输入 'exit' 退出)")
    print("---------------------------------------------")
    
    while True:
        user_input = input("\n您: ")
        if user_input.lower() in ['exit', 'quit', '退出']:
            print("再见!")
            break
        
        try:
            response = conversation.invoke({"input": user_input})
            print(f"\n机器人: {response['response']}")
        except Exception as e:
            print(f"\n发生错误: {str(e)}")
            print("请检查您的 Azure OpenAI 配置和网络连接。")

if __name__ == "__main__":
    main()