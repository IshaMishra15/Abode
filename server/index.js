const express=require ('express');
const app=express();
const cors=require('cors');
const mongoose = require('mongoose');
const bcrypt=require('bcrypt');
const User=require('./models/User.js');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const imageDownloader=require('image-downloader');
const path = require('path');
const bcryptSalt=bcrypt.genSaltSync(10);
const jwtSecret='newsecret';
const multer=require('multer');
const Place=require('./models/Place.js');
const BookingModel = require('./models/Booking.js');
require('dotenv').config();
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static( __dirname+'/uploads'));
const fs=require('fs');//file system library to rename the filepath of image that are uploaded from the system

app.use(cors({
    credentials:true,//allows cookies and authentication information to be included in cross-origin requests.
    origin:'http://localhost:5173',//specifies the allowed origin (the front-end application running on this URL)
}))

mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
}).then(()=>{
    console.log("DB connection successfull");
}).catch((err)=>{
    console.log(err.message);
})

app.get('/test',(req,resp)=>{
    resp.json('test ok');
})
app.post('/register', async(req,res)=>{
    const {name,email,password}=req.body;
    try{
        const userDoc=await User.create({
            name,
            email,
            password:bcrypt.hashSync(password,bcryptSalt),
        });
        res.json(userDoc);
    }
    catch(er)
    {
       res.status(422).json(er);
    }
    
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const userDoc = await User.findOne({ email });
        
        if (!userDoc) {
            return res.status(404).json({ error: 'Email not registered' });
        }

        const passOk = bcrypt.compareSync(password, userDoc.password);

        if (passOk) {
            jwt.sign({ email: userDoc.email,
                        id: userDoc._id ,
                        name:userDoc.name,}, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);
            });
        } else {
            res.status(422).json("Password not ok");
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/profile',(req,res)=>{
    const {token}=req.cookies;
    if(token)
        {
            jwt.verify(token,jwtSecret,{},async(err,userData)=>{
                if(err) throw err;
                const {name,email,_id}=await User.findById(userData.id);
                res.json({name,email,_id});
            });
        }
    else{
        res.json(null);
    }
    
});

app.post('/logout',(req,res)=>{
    res.cookie('token','').json(true);
})


app.post('/upload-by-link',async(req,res)=>{
    const{link}=req.body;
    const newName="photo"+Date.now()+ '.jpg';
    await imageDownloader.image({
        url:link,
        dest: __dirname + '/uploads/' +newName,
    });
    res.json(newName)
})

const upload = multer({ dest: 'uploads/' });

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to handle file uploads
app.post('/upload', upload.array('photos', 100), (req, res) => {
    const uploadedFiles = [];
    req.files.forEach(file => {
        const { path: tempPath, originalname } = file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = tempPath + '.' + ext;
        fs.renameSync(tempPath, newPath);
        // Extract only the filename
        const fileName = path.basename(newPath);
        uploadedFiles.push(fileName);
    });
    res.json(uploadedFiles);
});


app.post('/places', async (req, res) => {
    const { token } = req.cookies;
    const { title, address, addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests, price } = req.body;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const placeDoc = await Place.create({
                owner: userData.id,
                title,
                address,
                photos: addedPhotos,
                description,
                perks,
                extraInfo,
                checkIn,
                checkOut,
                maxGuests,
                price,
            });

            res.status(201).json(placeDoc);
        } catch (error) {
            console.error('Error creating place:', error);
            res.status(500).json({ message: 'Internal Server Error', error });
        }
    });
});


app.get('/user-places',(req,res)=>{
    const {token}=req.cookies;
    jwt.verify(token,jwtSecret,{},async(err,userData)=>{
        const {id}=userData;
        res.json(await Place.find({owner:id}));
    })
})

app.get('/places/:id',async (req,res)=>{
    const {id}=req.params;
    res.json(await Place.findById(id));
})

app.put('/places',async(req,res)=>{

    const { token } = req.cookies;
    const { id,title, address, addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests,price, } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err)throw err;
        const placeDoc=await Place.findById(id);
        // console.log(userData.id);
        // console.log(placeDoc.owner);
        if(userData.id === placeDoc.owner.toString()){
            placeDoc.set({
                    title,
                    address,
                    photos:addedPhotos,
                    description,
                    perks,
                    extraInfo,
                    checkIn,
                    checkOut,
                    maxGuests,price,
            })
            await placeDoc.save();
            res.json('ok');
        }
    })

})

app.get('/places',async (req,res)=>{
    res.json(await Place.find());
});


app.post('/bookings',async(req,res)=>{
    const userData=await getUserDataFromReq(req);
    const {place,checkIn,checkOut,numberGuests,name,phone,price,}=req.body;
    BookingModel.create({
        place,checkIn,checkOut,numberGuests,name,phone,price,user:userData.id,
    }).then((doc)=>{
        res.json(doc);
    }).catch((err)=>{throw err;})
});

function getUserDataFromReq(req)
{
    return new Promise((resolve,reject)=>{
        jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
            if(err) throw err;
            resolve(userData);
        });
    })
    
}


app.get('/bookings', async (req, res) => {
    try {
        const userData = await getUserDataFromReq(req);
        if (!userData) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const bookings = await BookingModel.find({ user: userData.id })
            .populate('place');
            
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});











/*********************************************************************************************************************************** */
const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
  socket.on('call:hangup', ({ to }) => {
    socket.to(to).emit('call:hangup');
  });
  

  
    // Handle video mute/unmute
    socket.on('video:mute', ({ to, muted }) => {
        io.to(to).emit('video:mute', { muted });
      });
    socket.on('audio:mute', ({ to, muted }) => {
        io.to(to).emit('audio:mute', { muted });
      });
});
app.listen(4000);




 
