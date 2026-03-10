export const disableGoogleTranslate = () => {
    // 1. Remove the googtrans cookie which forces translation
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";

    // 2. Hide the Google Translate widget if it exists
    const translateElement = document.getElementById('google_translate_element');
    if (translateElement) {
        translateElement.style.display = 'none';
        translateElement.style.visibility = 'hidden';
    }

    // 3. Remove the 'translated' class from HTML if added
    const htmlTag = document.querySelector('html');
    if (htmlTag && htmlTag.classList.contains('translated-ltr')) {
        htmlTag.classList.remove('translated-ltr');
    }
    
    // 4. Also hide the injected skiptranslate iframe
    const iframe = document.querySelector('.skiptranslate');
    if (iframe) {
        iframe.style.display = 'none';
    }
    
    // 5. Restore body top margin which Google Translate might have added
    document.body.style.top = '0px';
};
