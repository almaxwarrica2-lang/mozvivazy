const express = require('express');
const app = express();

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ users: [], deposits: [], withdrawals: [] }).write();

app.use(express.json());
app.use(express.static('public'));

const ADMIN = { user: "Admin", pass: "197200A.m" };

const vips = [
 {nome:"VIP 1", valor:300, diario:24},
 {nome:"VIP 2", valor:500, diario:40},
 {nome:"VIP 3", valor:1000, diario:80},
 {nome:"VIP 4", valor:2000, diario:160},
 {nome:"VIP 5", valor:3000, diario:240},
 {nome:"VIP 6", valor:5000, diario:400},
 {nome:"VIP 7", valor:10000, diario:800},
 {nome:"VIP 8", valor:20000, diario:1600},
 {nome:"VIP 9", valor:30000, diario:2400},
 {nome:"VIP 10", valor:50000, diario:4000}
];

// REGISTRO
app.post('/register',(req,res)=>{
  const {telefone, senha} = req.body;

  if(db.get('users').find({telefone}).value()){
    return res.json({msg:"Já existe"});
  }

  db.get('users').push({telefone, senha, saldo:0, banido:false}).write();
  res.json({ok:true});
});

// LOGIN
app.post('/login',(req,res)=>{
  const {telefone, senha} = req.body;

  if(telefone===ADMIN.user && senha===ADMIN.pass){
    return res.json({admin:true});
  }

  const user = db.get('users').find({telefone,senha}).value();
  if(!user) return res.json({erro:true});
  if(user.banido) return res.json({erro:"Banido"});

  res.json({user});
});

// VIP
app.get('/vips',(req,res)=>res.json(vips));

// INVESTIR
app.post('/investir',(req,res)=>{
  const {telefone,nome} = req.body;
  const user = db.get('users').find({telefone}).value();
  const vip = vips.find(v=>v.nome==nome);

  if(!user || !vip) return res.json({erro:true});
  if(user.saldo < vip.valor) return res.json({msg:"Saldo insuficiente"});

  db.get('users')
    .find({telefone})
    .assign({
      saldo: user.saldo - vip.valor,
      vip: vip.nome,
      diario: vip.diario,
      inicio: Date.now(),
      diasRecebidos: 0
    })
    .write();

  res.json({ok:true});
});

// GANHO
app.post('/ganho',(req,res)=>{
  const user = db.get('users').find({telefone:req.body.telefone}).value();

  if(!user || !user.vip) return res.json({msg:"Sem VIP"});

  const hoje = Math.floor(Date.now()/86400000);
  const inicio = Math.floor(user.inicio/86400000);

  const dias = hoje - inicio;

  if(dias <= user.diasRecebidos){
    return res.json({msg:"Já recebeu hoje"});
  }

  if(user.diasRecebidos >= 365){
    return res.json({msg:"Plano terminado"});
  }

  db.get('users')
    .find({telefone:user.telefone})
    .assign({
      saldo: user.saldo + user.diario,
      diasRecebidos: user.diasRecebidos + 1
    })
    .write();

  res.json({ganho:user.diario});
});

// STATUS
app.post('/status',(req,res)=>{
  const user = db.get('users').find({telefone:req.body.telefone}).value();

  if(!user || !user.vip) return res.json({});

  res.json({
    vip:user.vip,
    diario:user.diario,
    dias:user.diasRecebidos,
    restantes:365 - user.diasRecebidos
  });
});

app.listen(3000,()=>console.log("Servidor OK"));
