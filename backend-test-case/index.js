const dotenv = require('dotenv')
dotenv.config();
const express = require('express')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const mongoDB = require('mongodb')
const port = process.env.PORT || 3000

// MongoDB Database Connection
async function dbConn(req, res) {
  const connectionString = process.env.MONGOATLAS_URI || "mongodb://localhost:27017";
  const client = new mongoDB.MongoClient(connectionString);
  let conn = await client.connect();
  const db = conn.db("eigen");
  return db
}

// Controllers
async function showAllMember(req, res) {
  const db = await dbConn()
  const collection = db.collection("member");
  const collActiveBorrow = db.collection("activeBorrow");

  const findResult = await collection.find({}).toArray();

  let filterShow = []
  for (const e of findResult) {
    const resultActiveBorrow = await collActiveBorrow.countDocuments({ memberCode: e.code });
    filterShow.push({
      name: e.name,
      countBorrow: resultActiveBorrow
    })
  }

  return filterShow
}

async function showAllBook(req, res) {
  const db = await dbConn()
  const collBook = db.collection("book");
  const collActiveBorrow = db.collection("activeBorrow");

  const findResult = await collBook.find({}).toArray();

  let filterShow = []
  for (const e of findResult) {
    const resultActiveBorrow = await collActiveBorrow.countDocuments({ bookCode: e.code });
    if (e.stock - resultActiveBorrow > 0) {
      filterShow.push({
        code: e.code,
        title: e.title,
        author: e.author,
        stock: e.stock - resultActiveBorrow
      })
    }
  }

  return filterShow
}

async function showAllDataTableMember(req, res) {
  const db = await dbConn()
  const collection = db.collection("member");
  const findResult = await collection.find({}).toArray();
  return findResult
}

async function showAllDataTableBook(req, res) {
  const db = await dbConn()
  const collection = db.collection("book");
  const findResult = await collection.find({}).toArray();
  return findResult
}

async function showAllDataTableActiveBorrow(req, res) {
  const db = await dbConn()
  const collection = db.collection("activeBorrow");
  const findResult = await collection.find({}).toArray();
  return findResult
}

async function showAllDataTableMemberPenalty(req, res) {
  const db = await dbConn()
  const collection = db.collection("memberPenalty");
  const findResult = await collection.find({}).toArray();
  return findResult
}

async function addActiveBorrow(req, res) {
  const dataReq = req.body[0]

  const db = await dbConn()
  const collMember = db.collection("member");
  const collBook = db.collection("book");
  const collActiveBorrow = db.collection("activeBorrow");
  const collMemberPenalty = db.collection("memberPenalty");

  const dataBookLength = dataReq.bookCode.length
  if (dataBookLength < 1 || dataBookLength > 2) {
    return "client side wrong input - borrow book must 1 or 2 book"
  }

  const result1 = await collMember.findOne({ code: dataReq.memberCode });
  if (result1 == null) return "member cannot find, please check your member code."

  const result2 = await collMemberPenalty.findOne({ memberCode: dataReq.memberCode });
  if (result2 != null) {
    let date = new Date(result2.date)
    let day = String(date.getDate()).padStart(2, "0");
    let month = String(date.getMonth() + 1).padStart(1, "0");
    let year = date.getFullYear();

    let formattedDate = `${day}-${month}-${year}`;
    return "Member under penalty to borrow book. Member can borrow again on date " + formattedDate + "."
  }

  const resultMemberCountBorrow = await collActiveBorrow.countDocuments({ memberCode: dataReq.memberCode });
  if (resultMemberCountBorrow && dataBookLength == 2) {
    return "The member is currently borrowing 1 book, and there is 1 book left that can still be borrowed."
  }

  for (const e of dataReq.bookCode) {
    const resultBookByCode = await collBook.findOne({ code: e });
    if (resultBookByCode == null) {
      return `Did not find book code: ${e}`
    }
    const resultBookBorrow = await collActiveBorrow.countDocuments({ bookCode: e });
    if (resultBookByCode.stock - resultBookBorrow < 1) {
      return `Book code: ${e} out of stock`
    }
  }

  let lastIdACtiveBorrow = await collActiveBorrow.findOne({}, { sort: { id: -1 } });
  if (lastIdACtiveBorrow == null) {
    lastIdACtiveBorrow = 0
  } else {
    lastIdACtiveBorrow = lastIdACtiveBorrow.id
  }
  let arrayPost = [];
  dataReq.bookCode.forEach((e, i = 1) => {
    arrayPost.push(
      {
        id: lastIdACtiveBorrow + i + 1,
        memberCode: dataReq.memberCode,
        bookCode: e,
        date: dataReq.date,
      }
    )
  });
  const result5 = await collActiveBorrow.insertMany(arrayPost);
  return "Success save data member to borrow"
}

async function delActiveBorrow(req, res) {
  const dataReq = req.body[0]

  const db = await dbConn()
  const collActiveBorrow = db.collection("activeBorrow");
  const collMemberPenalty = db.collection("memberPenalty");

  const dataBookLength = dataReq.bookCode.length
  if (dataBookLength < 1 || dataBookLength > 2) {
    return "client side wrong input - return book must 1 or 2 book"
  }

  let penalty = false;
  for (const e of dataReq.bookCode) {
    const checkActiveBorrow = await collActiveBorrow.findOne({ memberCode: dataReq.memberCode, bookCode: e }, { sort: { id: -1 } });
    if (checkActiveBorrow == null) {
      return `Currently member code: ${dataReq.memberCode} didnt borrow book code: ${e}`
    }

    const dateBookBorrow = new Date(checkActiveBorrow.date).setHours(0, 0, 0, 0)
    const dateBookReturn = new Date(dataReq.date).setHours(0, 0, 0, 0)
    const intervalDate = ((dateBookReturn - dateBookBorrow) / (24 * 60 * 60 * 1000))
    if (intervalDate > 7) {
      penalty = true;
    }
  }

  const resultDeleteManyActiveBorrow = await collActiveBorrow.deleteMany({ memberCode: dataReq.memberCode, bookCode: { "$in": dataReq.bookCode } })

  if (penalty) {
    let lastIdACtiveBorrow = await collActiveBorrow.findOne({}, { sort: { id: -1 } });
    if (lastIdACtiveBorrow == null) {
      lastIdACtiveBorrow = 0
    } else {
      lastIdACtiveBorrow = lastIdACtiveBorrow.id
    }
    const setPenaltyDate = new Date(dataReq.date);
    setPenaltyDate.setDate(setPenaltyDate.getDate() + 3);
    const resultInsertOneMemberPenalty = await collMemberPenalty.insertOne({ id: lastIdACtiveBorrow + 1, memberCode: dataReq.memberCode, date: setPenaltyDate });
  }

  return `Member success return book`
}

async function syncMemberPenalty(req, res) {
  const dataReq = req.body[0]

  const db = await dbConn()
  const collMemberPenalty = db.collection("memberPenalty");

  const setDate = new Date(dataReq.date)
  setDate.setDate(setDate.getDate() - 3);

  const resultDeleteMemberPenalty = await collMemberPenalty.deleteMany({ "date": { "$lt": setDate } })

  let day = String(setDate.getDate()).padStart(2, "0");
  let month = String(setDate.getMonth() + 1).padStart(1, "0");
  let year = setDate.getFullYear();
  let formattedDate = `${day}-${month}-${year}`;

  return `Success sync to remove Member penalty under date ${formattedDate}`
}

// Routes
app.get('/', (req, res) => {
  res.send('Eigen Backend Test by KP')
})

app.get('/api/member', async (req, res) => {
  const result = await showAllMember()
  res.send(result)
})

app.get('/api/book', async (req, res) => {
  const result = await showAllBook()
  res.send(result)
})

app.get('/api/other/table/member', async (req, res) => {
  const result = await showAllDataTableMember()
  res.send(result)
})

app.get('/api/other/table/book', async (req, res) => {
  const result = await showAllDataTableBook()
  res.send(result)
})

app.get('/api/other/table/activeborrow', async (req, res) => {
  const result = await showAllDataTableActiveBorrow()
  res.send(result)
})

app.get('/api/other/table/memberpenalty', async (req, res) => {
  const result = await showAllDataTableMemberPenalty()
  res.send(result)
})

app.post('/api/borrow', async (req, res) => {
  const result = await addActiveBorrow(req)
  res.send(result)
})

app.delete('/api/return', async (req, res) => {
  const result = await delActiveBorrow(req)
  res.send(result)
})

app.delete('/api/sync/memberpenalty', async (req, res) => {
  const result = await syncMemberPenalty(req)
  res.send(result)
})

// Express PORT
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
