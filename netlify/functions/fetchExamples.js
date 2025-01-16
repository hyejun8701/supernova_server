const axios = require('axios');
const { JSDOM } = require('jsdom');

exports.handler = async function(event, context) {
  const word = event.queryStringParameters.word;

  if (!word) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '단어를 입력해주세요.' }),
    };
  }

  const url = `https://en.wiktionary.org/wiki/${word}`;

  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const examples = [];
    const translatedExamples = [];

    const exampleElements = document.querySelectorAll('.h-usage-example i');

    for (const element of exampleElements) {
      let exampleText = element.textContent.trim();
      if (exampleText) {
        examples.push(exampleText);

        // Google Translate URL 생성
        const translateUrl = `https://translate.google.com/m?hl=ko&sl=en&tl=ko&ie=UTF-8&q=${encodeURIComponent(exampleText)}`;

        // 번역 결과 크롤링
        const translateResponse = await axios.get(translateUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0'  // 봇 차단 방지
          }
        });

        const translateDom = new JSDOM(translateResponse.data);
        const translatedTextElement = translateDom.window.document.querySelector('.result-container');

        if (translatedTextElement) {
          translatedExamples.push({
            original: exampleText,
            translated: translatedTextElement.textContent.trim(),
          });
        } else {
          translatedExamples.push({
            original: exampleText,
            translated: '번역 실패',
          });
        }
      }
    }

    if (translatedExamples.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ examples: translatedExamples }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: '예문을 찾을 수 없습니다.' }),
      };
    }
  } catch (error) {
    console.error('오류:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '서버 오류 발생' }),
    };
  }
};
