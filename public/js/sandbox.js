// router.post('/:id/comment', (req, res)=>{
//   let content = req.body.comment;
//   Transaction.findById(req.params.id, (err, foundTrans)=>{
//     if(err){
//       error(req, res, err);
//     } else {
//       User.findOne({_id:req.user._id}, (err, foundCommenter)=>{
//         if(err){
//           error(req, res, err, foundTrans._id);
//         } else {
//           let recipient;
//           if(foundTrans.artist.id == req.user._id.toString()){
//             recipient = foundTrans.client.id;
//           } else if(foundTrans.client.id == req.user._id.toString()){
//             recipient = foundTrans.artist.id;
//           } else {
//             error(req, res, 'Sorry. Public comment isn\'t allowed on transactions', foundTrans._id);
//           }
//           User.findOne({_id:recipient}, (err, foundRecipient)=>{
//             if(err){
//               error(req, res, err, foundTrans._id);
//             } else {
//               Comment.create({from:foundCommenter._id, date, content}, (err, newComment)=>{
//                 if(err){
//                   error(req, res, err, foundTrans._id);
//                 } else {
//                   Notification.create({from:foundCommenter._id, date, transaction:foundTrans._id, comment:newComment._id, text:`${foundCommenter.username} commented on your transaction.`,type:'transComment', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
//                     if(err){
//                       error(req, res, err, foundTrans._id);
//                     } else {
//                       foundRecipient.notifications.unshift(newNote._id);
//                       foundRecipient.save();
//                       foundTrans.comments.push(newComment._id);
//                       foundTrans.save();
//                       req.flash('success', 'You tell \'em! (in a nice way that doesn\'t violate our ToS, of course.)');
//                       res.redirect('back');
//                     }
//                   });
//                 }
//               });
//             }
//           });
//         }
//       });
//     }
//   });
// });