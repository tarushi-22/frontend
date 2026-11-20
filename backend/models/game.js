const mongoose=require('mongoose');
const gameSchema=new mongoose.Schema({
	playerName:{
		type:String,
		required:true,
		default:"Guest"
	},
	foundCharacters:{
		type:[Number],
		default:[]
	},
	startedAt:{
		type:Date,
		default:Date.now
	},
	incorrectClicks:{
		type:Number,
		default:0
	},
	completedAt:{
		type:Date,
		default:null
	},
	duration:{
		type:Number,
		default:null
	},
	completed:{
		type:Boolean,
		default:false
	}
});
const Game=mongoose.model("Game",gameSchema);
module.exports=Game;
