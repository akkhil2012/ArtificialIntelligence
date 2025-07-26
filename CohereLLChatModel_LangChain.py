import os
from dotenv import load_dotenv

def main():
    try:
        # Load environment variables
        load_dotenv()
        
        # Get API key from environment variables
        api_key = os.getenv("COHERE_API_KEY")
        if not api_key:
            api_key = input("Enter your Cohere API key: ")
            os.environ["COHERE_API_KEY"] = api_key

        # Import cohere after setting the API key
        import cohere
        
        # Initialize the Cohere client
        co = cohere.Client(api_key)
        
        # Make a chat request
        response = co.chat(
            message="Translate 'hi!' to Italian",
            model="command-r-plus",
            temperature=0.7,
            max_tokens=100
        )
        
        # Print the response
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        if "COHERE_API_KEY" in str(e):
            print("Please make sure you have set the COHERE_API_KEY")
        elif "401" in str(e):
            print("Invalid API key. Please check your Cohere API key.")
        else:
            print("Please check your internet connection and try again")

if __name__ == "__main__":
    main()


# reuirements.txt#
langchain>=0.1.0
openai
huggingface_hub
langchain_google_genai
python-dotenv>=1.0.0
cohere
langchain-community>=0.0.10


# If the issue is the package is there but not imported
#reason check the path of the python interpreter and install at python version level

#/Users/akhil/.pyenv/versions/3.10.11/bin/pip install python-dotenv
#/Users/akhil/.pyenv/versions/3.10.11/bin/pip install langchain_community
#/Users/akhil/.pyenv/versions/3.10.11/bin/pip install langchain_huggingface
