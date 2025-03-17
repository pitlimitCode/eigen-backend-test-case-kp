
console.log("-----")

// 1. Terdapat string "NEGIE1", silahkan reverse alphabet nya dengan angka tetap diakhir kata Hasil = "EIGEN1"
console.log("Soal 1")
const string1 = "NEGIE1"
console.log('string1: ', string1);
const result1 = string1.split("").reverse().join("")
console.log('result1: ', result1);

console.log("-----")

/*
2. Diberikan contoh sebuah kalimat, silahkan cari kata terpanjang dari kalimat tersebut, jika ada kata dengan panjang yang sama silahkan ambil salah satu
Contoh:  
const sentence = "Saya sangat senang mengerjakan soal algoritma"
longest(sentence) 
// mengerjakan: 11 character
*/
console.log("Soal 2")
const string2 = "Saya sangat senang mengerjakan soal algoritma"
console.log('string2: ', string2);
const tes = string2.split(" ")
let lengthword2 = 1;
let result2 = "a";
for(const word of tes){
  if (lengthword2 < word.length){
    lengthword2 = word.length
    result2 = word
  }
}
console.log('result2: ', `${result2} = ${lengthword2} character`);

console.log("-----")

/*
3. Terdapat dua buah array yaitu array INPUT dan array QUERY, silahkan tentukan berapa kali kata dalam QUERY terdapat pada array INPUT
Contoh:  
INPUT = ['xc', 'dz', 'bbb', 'dz']  
QUERY = ['bbb', 'ac', 'dz']  
OUTPUT = [1, 0, 2] karena kata 'bbb' terdapat 1 pada INPUT, kata 'ac' tidak ada pada INPUT, dan kata 'dz' terdapat 2 pada INPUT
*/
console.log("Soal 3")
const INPUT = ['xc', 'dz', 'bbb', 'dz']  
const QUERY = ['bbb', 'ac', 'dz']
console.log('INPUT: ', INPUT);
console.log('QUERY: ', QUERY);
const result3 = []
for (const aQuery of QUERY){
  let count = 0;
  for (const aInput of INPUT){
    if(aInput == aQuery){
      count = count + 1
    }
  }
  result3.push(count)
}
console.log('result3: ', result3);

console.log("-----")

/*
4. Silahkan cari hasil dari pengurangan dari jumlah diagonal sebuah matrik NxN
Contoh:
Matrix = [ [1, 2, 0], [4, 5, 6], [7, 8, 9] ]
diagonal pertama = 1 + 5 + 9 = 15 
diagonal kedua = 0 + 5 + 7 = 12 
maka hasilnya adalah 15 - 12 = 3
*/
console.log("Soal 4")
const Matrix = [
  [1, 2, 0],
  [4, 5, 6],
  [7, 8, 9]
]
console.log('Matrix: ', Matrix);
const nLength = Matrix.length;

let dia1 = 0
for (let i = 0; i < nLength; i++) {
  const value = Matrix[i][i];
  dia1 = dia1 + value
}

let dia2 = 0
for (let i = 0; i < nLength; i++) {
  for (let j = nLength; j > 0; j--) {
    if (i+j == nLength){
      const value = Matrix[i][(j-1)];
      dia2 = dia2 + value
    }
  }
}
const result4 = dia1 - dia2;
console.log('result4: ', `maka hasilnya adalah ${dia1} - ${dia2} = ${dia1-dia2}`);

console.log("-----")
