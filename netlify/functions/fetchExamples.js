const axios = require('axios');
const { JSDOM } = require('jsdom');

exports.handler = async function(event, context) {
  const word = event.queryStringParameters.word;

  // 단어가 없으면 400 에러 반환
  if (!word) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '단어를 입력해주세요.' }),
    };
  }

  // Wiktionary URL 설정
  const url = `https://en.wiktionary.org/wiki/${word}`;

  try {
    // 페이지 크롤링
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const examples = [];

    // 예문을 정확히 찾아내는 부분
    const exampleElements = document.querySelectorAll('.h-usage-example i');
    
    exampleElements.forEach((element) => {
      let exampleText = element.textContent.trim();
      if (exampleText) {
        // 특수 문자가 있는 예문을 URL 인코딩하여 처리
        exampleText = encodeURIComponent(exampleText);
        examples.push(exampleText);
      }
    });

    // 예문이 있으면 반환, 없으면 404 반환
    if (examples.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ examples }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: '예문을 찾을 수 없습니다.' }),
      };
    }
  } catch (error) {
    console.error('크롤링 오류:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '크롤링 오류 발생' }),
    };
  }
};
