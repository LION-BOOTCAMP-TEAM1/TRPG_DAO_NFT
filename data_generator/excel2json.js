const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 📂 변환할 Excel 파일 경로
const EXCEL_FILE = 'data.xlsx';

// 📜 Excel -> JSON 변환 함수
const excelToJson = (filePath) => {
    // 엑셀 파일 읽기
    const workbook = xlsx.readFile(filePath);
	
    // 🔹 모든 시트 처리
    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];

        // 🔹 JSON 변환
        let jsonData = xlsx.utils.sheet_to_json(worksheet);

		// 🔹 data 폴더 생성 (존재하지 않으면 만들기)
        const dataFolder = path.join(__dirname, 'data');
        if (!fs.existsSync(dataFolder)) {
            fs.mkdirSync(dataFolder);
        }
		
        // 🔹 시트 이름으로 폴더 생성 (존재하지 않으면 만들기)
        const sheetFolder = path.join(__dirname, 'data', sheetName);
        if (!fs.existsSync(sheetFolder)) {
            fs.mkdirSync(sheetFolder);
        }

        // 🔹 각 행을 개별 JSON 파일로 저장
        jsonData.forEach((row, index) => {
            const rowFile = path.join(sheetFolder, `${index + 1}.json`);
            fs.writeFileSync(rowFile, JSON.stringify(row, null, 4), 'utf-8');
            console.log(`✅ 저장 완료: ${rowFile}`);
        });
    });

    console.log('🎉 모든 JSON 파일 생성 완료!');
};

// 실행
excelToJson(EXCEL_FILE);
