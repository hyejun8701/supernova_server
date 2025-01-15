// netlify/functions/fetchExamples.js
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

    // 예문 추출
    const examples = [];
    const exampleList = document.querySelector('#English + ol');
    
    if (exampleList) {
      exampleList.querySelectorAll('li').forEach((element) => {
        const exampleText = element.querySelector('.h-usage-example i')?.textContent.trim();
        if (exampleText && exampleText.length > 10) {
          examples.push(exampleText);
        }
      });
    }

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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '크롤링 오류 발생' }),
    };
  }
};
