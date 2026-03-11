import os
import glob
import csv
from bs4 import BeautifulSoup
import re

# Instagram DM data directory
DM_DIR = '/Users/kazuosomeya/Downloads/meta-2026-Mar-09-09-38-05/instagram-daikoku_hunters-2026-03-10-NPNY9vfV/your_instagram_activity/messages/inbox'

# Output CSV file
OUTPUT_CSV = '/Users/kazuosomeya/Desktop/daikoku-tour/bookings_extracted.csv'

# Required Links
PAYMENT_LINKS = ['paypal.me', 'paypal.com', 'highwaygodzilla.com/products/deposit', 'daikokuhunter.com/products/deposit']

def extract_bookings():
    all_conversations = []
    
    # Iterate over all message.html files
    for filepath in glob.glob(os.path.join(DM_DIR, '*/message_*.html')):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            continue
            
        soup = BeautifulSoup(content, 'html.parser')
        
        # In Instagram HTML export, <main> usually contains the messages
        main_content = soup.find('main')
        if not main_content:
            continue
            
        # The title of the page or the first h1 is usually the chat partner name
        h1_tag = soup.find('h1')
        chat_partner = h1_tag.text.strip() if h1_tag else "Unknown"
        
        # Each message is often inside a div with class '_a6-g' or similar, but let's iterate over typical div containers
        # We'll look for divs that have headers (sender name) and content.
        # Instagram's structure is typically:
        # <div class="...">
        #   <h2>Sender Name</h2>
        #   <div>Message Content</div>
        #   <div>Timestamp</div>
        # </div>
        
        messages = []
        message_containers = main_content.find_all('div', recursive=False)
        for container in message_containers:
            h2 = container.find('h2')
            if not h2:
                continue
                
            sender = h2.text.strip()
            # The message content is usually in the next divs
            # We can grab all text within the container that isn't the h2 or the timestamp (which is the last div)
            divs = container.find_all('div')
            if len(divs) >= 2:
                # Naive text extraction
                message_text = " ".join([d.text for d in divs[:-1] if d.text != sender]).strip()
                timestamp = divs[-1].text.strip()
                
                messages.append({
                    'sender': sender,
                    'text': message_text,
                    'timestamp': timestamp
                })
                
        # Now analyze the conversation
        has_booking_intent = False
        booking_details = []
        
        for msg in messages:
            lower_text = msg['text'].lower()
            if any(link in lower_text for link in PAYMENT_LINKS):
                has_booking_intent = True
            # Extract some context (the message itself)
            # Add all non-trivial messages so we can see the context of the booking
            if len(lower_text) > 5:
                 booking_details.append(f"[{msg['timestamp']}] {msg['sender']}: {msg['text']}")

        if has_booking_intent and booking_details:
             # Basic heuristics for getting dates, numbers
             all_text = " ".join(b for b in booking_details)
             
             # Try to find dates (very naive)
             dates = re.findall(r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(th|st|nd|rd)?', all_text.lower())
             date_str = ", ".join([f"{d[0]} {d[1]}".strip() for d in dates]) if dates else "Not found"
             
             # Try to find number of people
             people = re.findall(r'(\d+)\s*(people|pax|persons)', all_text.lower())
             people_str = ", ".join([p[0] for p in people]) if people else "Not found"
             
             all_conversations.append({
                 'chat_partner': chat_partner,
                 'possible_date': date_str,
                 'possible_pax': people_str,
                 'conversation_snippet': "\n".join(booking_details[-5:]) # Last 5 relevant messages
             })

    print(f"Found {len(all_conversations)} potential booking conversations.")
    
    # Write to CSV
    with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as csvfile:
        fieldnames = ['chat_partner', 'possible_date', 'possible_pax', 'conversation_snippet']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for conv in all_conversations:
            writer.writerow(conv)
            
    print(f"Results written to {OUTPUT_CSV}")

if __name__ == '__main__':
    extract_bookings()
