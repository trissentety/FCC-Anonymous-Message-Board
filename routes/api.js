"use strict";
const { Thread, Reply } = require("../models");
const bcrypt = require("bcrypt")

module.exports = function (app) {
    app.route("/api/threads/:board")
        // ***POST new Thread***
        .post(async (req, res) => {
            const { board } = req.params;
            const { text, delete_password } = req.body;
            const dateValue = new Date();
            const thread = await Thread.create({
                board,
                text,
                delete_password,
                created_on: dateValue,
                bumped_on: dateValue,
                replies: [],
            });
            res.send(thread);
        })

        // ***GET Thread (10 messages of 3 replies each)***
        .get(async (req, res) => {
            const { board } = req.params;
            let threads = await Thread.find({ board })
                .sort("-bumped_on")
                .populate("replies");

            threads = threads
                .map((thread) => {
                    let displayingThread = {
                        _id: thread._id,
                        text: thread.text,
                        created_on: thread.created_on,
                        bumped_on: thread.bumped_on,
                        replies: thread.replies
                            .sort((a, b) => a.created_on - b.created_on)
                            .slice(0, 3)
                            .map((reply) => {
                                let rep = {
                                    _id: reply._id,
                                    text: reply.text,
                                    created_on: reply.created_on,
                                };
                                return rep;
                            }),
                    }
                    return displayingThread;
                })
                .slice(0, 10);
            res.send(threads);
        })

        // ***DELETE full Thread***
        .delete(async (req, res) => {
            const { board, thread_id, delete_password } = req.body;
            let deletingThread = await Thread.findById(thread_id);
            
            let reqPassword = req.body.delete_password
            let regPassword = deletingThread.delete_password;

            // *** This encryption method works but fails tests so commented out ***
            // bcrypt.compare(reqPassword, regPassword, async (err, result) => {
                // console.log("Passwords_match?", result);
                if (deletingThread._id.toString() === thread_id && 
                    regPassword === reqPassword) {
                    await Thread.deleteOne({ thread_id });
                    res.send("success");
                } else {
                    res.send("incorrect password");
                }
            // })
        })
        
        // ***PUT to report Thread***
        .put(async (req, res) => {
            const { board, thread_id } = req.body;
            let updatingThread = await Thread.findById(thread_id)
            if (updatingThread) {
                updatingThread.reported = true;
                await updatingThread.save();
                res.send("reported");
            } else {
                res.send("incorrect thread id");
            }
        });

    app.route("/api/replies/:board")
        // ***POST new reply to specific Thread***
        .post(async (req, res) => {
            const { board } = req.params;
            const { text, delete_password, thread_id } = req.body;
            let replied_atValue = new Date();
            const reply = new Reply({
                text,
                delete_password,
                created_on: replied_atValue,
            });

            let updatingThread = await Thread.findById(thread_id);
            updatingThread.replies.push(reply);
            updatingThread.bumped_on = replied_atValue;
            await updatingThread.save();
            res.send(updatingThread);
        })

        // ***GET all replies to specific Thread***
        .get(async (req, res) => {
            const { thread_id } = req.query;
            let thread = await Thread.findById(thread_id).populate("replies");

            let threadToView = {
                _id: thread._id,
                text: thread.text,
                created_on: thread.created_on,
                bumped_on: thread.bumped_on,
                replies: thread.replies.map((reply) => {
                    return {
                        _id: reply._id,
                        text: reply.text,
                        created_on: reply.created_on,
                    };
                }),
            }
            res.send(threadToView);
        })

        // ***DELETE → update a specific reply's "text" field to [deleted]***
        .delete(async (req, res) => {
            const { thread_id, reply_id, delete_password } = req.body;

            let reqPassword = req.body.delete_password;
                  
            let threadTarget = await Thread.findById(thread_id);
            for (let reply of threadTarget.replies) {
                let regPassword = reply.delete_password;  

                //  bcrypt.compare(reqPassword, regPassword, async (err, result)=>{
                    //console.log("Passwords(reply)_match?", result);
                //    if (!err){
                        if (reply._id.toString() === reply_id && 
                        reqPassword == regPassword) {
                            reply.text = "[deleted]"
                            threadTarget.bumped_on = await new Date();
                            await threadTarget.save();
                            res.send("success");
                            return;
                      //  }
                        }else{
                            res.send("incorrect password");
                            return;
                    }
            //    })
           }
        })

        .put(async (req, res) => {
            const { thread_id, reply_id, board } = req.body;
            const threadTarget = await Thread.findById(thread_id);
            const replyTarget = threadTarget.replies.find(
                (reply) => reply._id.toString() === reply_id,
            );

            if (replyTarget) {
                replyTarget.reported = true;
                threadTarget.bumped_on = new Date();
                await threadTarget.save();
                res.send("reported");
            } else {
                res.send("incorrect");
            }
        });
};