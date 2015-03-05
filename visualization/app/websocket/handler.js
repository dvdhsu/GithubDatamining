/**Anthony Guo
 */


function HandleSocket(socket){
    console.log('handling new socket');

    socket.on('disconnect', HandleDisconnect);
}

function HandleDisconnect(){

}


module.exports = {
    //Handles a socket connection
    HandleSocket : HandleSocket

}
