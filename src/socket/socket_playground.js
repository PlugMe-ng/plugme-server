/* eslint-disable */

function includeJsFile(fileName) {
  const _script = document.createElement('script');
  _script.src = fileName;
  document.body.appendChild(_script);
}

includeJsFile('/socket.io/socket.io.js');
let socket = io.connect('http://localhost:3000', { query: 'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImlkcmlzYWRldHVubWJpQGdtYWlsLmNvbSIsImlhdCI6MTUzNDUxNjgzNX0.jpo57-W8kvqQSuIPJZVCF_Stot4oxmwKVxgKRc1ij24'} )
socket.on('connected_clients', (connected_clients) => { console.log('>>>>>>>>>>>', connected_clients) });



