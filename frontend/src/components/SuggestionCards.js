import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

const SuggestionCards = ({ 
  content = '', 
  onSuggestionClick, 
  isGenerating = false,
  showInInputArea = false,
  compact = false,
  maxSuggestions = 3
}) => {
  const { extractedSuggestions } = useMemo(() => {
    let extractedSuggestions = [];
    let cleanedContent = content;

    const h3ParagraphMatch = content.match(/<h[1-6][^>]*>Next Suggestion[s]?[^<]*<\/h[1-6]>\s*<p[^>]*>([^<]+)<\/p>/i);
    if (h3ParagraphMatch) {
      const suggestionText = h3ParagraphMatch[1];
      const suggestionArray = suggestionText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      suggestionArray.forEach(suggestion => {
        let cleanSuggestion = suggestion.trim();
        cleanSuggestion = cleanSuggestion.replace(/<[^>]*>/g, '');
        if (!cleanSuggestion.endsWith('?')) {
          cleanSuggestion += '?';
        }
        extractedSuggestions.push({
          text: cleanSuggestion,
          icon: 'HelpCircle',
          category: "follow-up"
        });
      });
    }

    if (extractedSuggestions.length === 0) {
      const htmlParagraphListMatch = content.match(/<p[^>]*>Next Suggestion[s]?:?<\/p>\s*<ul[^>]*>(.*?)<\/ul>/is);
      if (htmlParagraphListMatch) {
        const listContent = htmlParagraphListMatch[1];
        const listItems = listContent.match(/<li[^>]*>(.*?)<\/li>/gi);
        
        if (listItems) {
          listItems.forEach(item => {
            const cleanItem = item.replace(/<\/?li[^>]*>/gi, '').trim();
            if (cleanItem) {
              let cleanSuggestion = cleanItem.trim().replace(/<[^>]*>/g, '');
              if (!cleanSuggestion.endsWith('?')) {
                cleanSuggestion += '?';
              }
              extractedSuggestions.push({
                text: cleanSuggestion,
                icon: 'HelpCircle',
                category: "follow-up"
              });
            }
          });
        }
      }
    }

    cleanedContent = cleanedContent.replace(/<h[1-6][^>]*>Next Suggestion[s]?[^<]*<\/h[1-6]>\s*<p[^>]*>[^<]+<\/p>/i, '');
    cleanedContent = cleanedContent.replace(/<p[^>]*>Next Suggestion[s]?:?<\/p>\s*<ul[^>]*>.*?<\/ul>/is, '');
    cleanedContent = cleanedContent.replace(/<p[^>]*>\s*<\/p>/g, '').trim();
    
    return { extractedSuggestions, cleanedContent };
  }, [content]);

  const shouldReturn = !showInInputArea || isGenerating || !extractedSuggestions || extractedSuggestions.length === 0;

  if (shouldReturn) {
    return null;
  }

  const getSuggestionText = (suggestion) => {
    return suggestion.text || suggestion;
  };

  const handleSuggestionClick = (suggestion) => {
    const text = getSuggestionText(suggestion);
    onSuggestionClick?.(text);
  };

  const SuggestionButton = ({ suggestion, index }) => (
    <button
      key={index}
      onClick={() => handleSuggestionClick(suggestion)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 ease-in-out text-sm shadow-sm hover:shadow-md whitespace-nowrap transform hover:scale-105"
      title={getSuggestionText(suggestion)}
    >
      <Sparkles className="w-4 h-4 text-gray-400" />
      <span className="text-blue-600 font-medium truncate max-w-[200px]">
        {getSuggestionText(suggestion)}
      </span>
    </button>
  );

  const SuggestionContainer = ({ children }) => (
    <div className="mb-1">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      </div>
    </div>
  );

  const suggestionButtons = extractedSuggestions
    .slice(0, maxSuggestions)
    .map((suggestion, index) => (
      <SuggestionButton key={index} suggestion={suggestion} index={index} />
    ));

  return (
    <SuggestionContainer>
      {suggestionButtons}
    </SuggestionContainer>
  );
};

export const cleanSuggestionsFromContent = (content) => {
  if (!content) return content;
  
  let cleanedContent = content;
  
  cleanedContent = cleanedContent.replace(/<h[1-6][^>]*>Next Suggestion[s]?[^<]*<\/h[1-6]>\s*<p[^>]*>[^<]+<\/p>/i, '');
  cleanedContent = cleanedContent.replace(/<p[^>]*>Next Suggestion[s]?:?<\/p>\s*<ul[^>]*>.*?<\/ul>/is, '');
  cleanedContent = cleanedContent.replace(/<p[^>]*>\s*<\/p>/g, '').trim();
  
  return cleanedContent;
};

export default SuggestionCards;