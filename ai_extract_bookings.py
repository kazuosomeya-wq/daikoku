import csv
import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# We need the user's Gemini API key. If not locally available in .env, we can 
# fallback to asking them, but usually they have it injected in env or codebase.
# The user's firebase config has an API key, we might try that or another open key.
# Actually, the user's firebase api key might not work for gemini. 
# Let's hope GEMINI_API_KEY is in their environment or we will print an error.

api_key = os.environ.get("GEMINI_API_KEY")
# Provide a fallback if they don't have it explicitly set - using the studio one if possible
if not api_key:
    api_key = os.environ.get("VITE_FIREBASE_API_KEY", "AIzaSyADAJTHA2x8FR_HqrlnZkOd1ZJCGvO5Jyg")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

input_file = 'bookings_extracted.csv'
output_file = 'bookings_ai_extracted.csv'

def process_row(row):
    prompt = f"""
Extract the booking date and number of people (pax) for the Daikoku Tour from the following Instagram DM conversation.
If the year is not mentioned, assume 2024 or 2025 depending on context (usually the dates talked about are in the future of the message timestamp).
Return the result EXACTLY as a JSON object with keys "date" (format: YYYY-MM-DD, or "Unknown" if not found) and "pax" (integer, or "Unknown").
Do not include markdown blocks or any other text. Just the JSON object.

Conversation:
{row['conversation_snippet']}
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip().replace('```json', '').replace('```', '').strip()
        data = json.loads(text)
        row['ai_date'] = data.get('date', 'Unknown')
        row['ai_pax'] = data.get('pax', 'Unknown')
    except Exception as e:
        print(f"Error processing {row['chat_partner']}: {e}")
        row['ai_date'] = 'Error'
        row['ai_pax'] = 'Error'
        
    return row

def main():
    rows = []
    with open(input_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
            
    print(f"Loaded {len(rows)} rows. Sending to Gemini...")

    processed = []
    for i, row in enumerate(rows):
        print(f"Processing {i+1}/{len(rows)}: {row['chat_partner']}")
        p_row = process_row(row)
        processed.append(p_row)
        time.sleep(1) # rate limit prevention

    fieldnames = ['chat_partner', 'possible_date', 'possible_pax', 'conversation_snippet', 'ai_date', 'ai_pax']
    with open(output_file, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for p in processed:
            writer.writerow(p)

    print(f"Finished! Output written to {output_file}")

if __name__ == '__main__':
    main()
