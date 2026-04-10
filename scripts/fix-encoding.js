const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix BOM
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
content = content.replace(/^´╗┐/, '');

const map = {
  'â”€': '─',
  'OlÃ¡': 'Olá',
  'proteÃ§Ã£o': 'proteção',
  'ColisÃ£o': 'Colisão',
  'grÃ¡tis': 'grátis',
  'decisÃµes': 'decisões',
  'relatÃ³rios': 'relatórios',
  'AnÃ¡lise': 'Análise',
  'RecomendaÃ§Ã£o': 'Recomendação',
  'AprovaÃ§Ã£o': 'Aprovação',
  'InvestigaÃ§Ã£o': 'Investigação',
  'NecessÃ¡ria': 'Necessária',
  'anÃ¡lise': 'análise',
  'UsuÃ¡rios': 'Usuários',
  'padrÃµes': 'padrões',
  'PadrÃµes': 'Padrões',
  'nÃ£o': 'não',
  'NÃ£o': 'Não',
  'AprovaÃ§Ã£o': 'Aprovação',
  'usuÃ¡rios': 'usuários',
  'MÃ¡ximo': 'Máximo',
  'mÃ¡ximo': 'máximo',
  'MÃ­nimo': 'Mínimo',
  'mÃ­nimo': 'mínimo',
  'vÃ¡rios': 'vários',
  'VocÃª': 'Você',
  'vocÃª': 'você',
  'PadrÃ£o': 'Padrão',
  'padrÃ£o': 'padrão',
  'sÃ£o': 'são',
  'SÃ£o': 'São',
  'gravaÃ§Ãµes': 'gravações',
  'gestÃ£o': 'gestão',
  'GestÃ£o': 'Gestão',
  'nÃ­vel': 'nível',
  'Ã¡': 'á',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã£': 'ã',
  'Ã©': 'é',
  'Ãª': 'ê',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãµ': 'õ',
  'Ãº': 'ú',
  'Ã§': 'ç',
  'Ã': 'À', // Only uppercase À is single Ã ?
};

for (const [bad, good] of Object.entries(map)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done mapping.');
