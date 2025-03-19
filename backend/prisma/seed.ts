import { exec } from 'child_process';
import path from 'path';

// Execute our main seed script
exec('ts-node ' + path.join(__dirname, '../src/seed/seed.ts'), (error, stdout, stderr) => {
  if (error) {
    console.error(`시딩 스크립트 실행 오류: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`시딩 스크립트 오류: ${stderr}`);
    return;
  }
  
  console.log(`시딩 스크립트 출력: ${stdout}`);
}); 