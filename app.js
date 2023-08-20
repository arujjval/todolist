const express= require("express")
const bodyParser= require("body-parser")
const date= require(__dirname + "/date.js")   //For creating our own modules, google Node.js modules
const mongoose= require('mongoose')
const _= require('lodash')
const uri= 'mongodb+srv://arujjwal73:test123@cluster0.p49ed2y.mongodb.net/todoListDB'
mongoose.connect(uri)

const app=express()

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

//SCHEMAS
const itemSchema= {
    name: String
}

const listSchema= {
    name: String, 
    item: [itemSchema]
}

const List= mongoose.model('List', listSchema)

const Item= mongoose.model('Item', itemSchema)   //Name of model is parameter should be singular

const item1= new Item({
    name: "Welcome to your todoList!"
})

const item2= new Item({
    name: "Hit the + button to add a new item."
})

const item3= new Item({
    name: "<-- Hit this to delete an item."
})

const defaultItems= [item1, item2, item3]


app.get('/', function(req, res){
    Item.find({}).then(function(items){
        if(items.length===0){
            Item.insertMany(defaultItems).then(function(data){
                if(data){ 
                    console.log("insertMany performed successfully")
                }
            }).catch(function(err){
                console.log(err)
            })
        }
        res.render("list", {ListTitle: date.getDate(), items: items, route: '/'});
    }).catch(function(err){
        console.log(err);
    })
    //'Render' is kinda like "sendFile", it sends EJS file(here, list) which is in "views" folder by default
    //Second parameter shows values of different variables inside EJS file
})

app.post('/', function(req, res){
    //console.log(req.body)
    Item.create({name: req.body.newTask})
    res.redirect('/')    //goes back to get request of path "/" above
})

app.post("/delete", function(req, res){
    let listName= req.body.listName
    listName= listName.slice(1)
    console.log(listName)
    const checkedItemId= req.body.checkbox
    if(listName===''){
        Item.findByIdAndRemove(checkedItemId).then(function(data){
            res.redirect('/')
        }).catch(function(err){
            console.log(err)
        })
    }else{
        List.findOneAndUpdate({name: listName}, {$pull:{item:{_id: checkedItemId}}}).then(function(data){
            console.log("item deleted from "+listName)
        }).catch(function(err){
            console.log(err)
        })
    }
    res.redirect('/'+listName)
})

app.get('/:customList', function(req,res){
    const customList= _.capitalize(req.params.customList)

    List.findOne({name: customList}).then(function(data){
        if(data){
            console.log("list already exists.")
            res.render('list', {ListTitle: data.name, items: data.item, route: '/'+customList})
        }else{
            const list= new List({
                name :customList,
                item: defaultItems
            })
            list.save()
            console.log('new list '+customList+" formed.")
            res.redirect('/'+ customList)
        }
    }).catch(function(err){
        console.log(err);
    })
})

app.post('/:customList', function(req, res){
    const customList= req.params.customList
    const newTask= req.body.newTask
    List.findOne({name: customList}).then(function(data){
        const item= new Item({
            name: newTask
        })
        data.item.push(item)
        data.save()
        console.log("New task added in " + customList)
        res.redirect('/'+ customList)
    })
})

app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port 3000")
})