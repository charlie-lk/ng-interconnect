# NgInterconnect

Makes it possible to pass data between Angular components which are placed anywhere in the component hierarchy.  Works across routes and dynamically loaded components. 

# Usage

[![NPM](https://nodei.co/npm/ng-interconnect.png?mini=true)](https://nodei.co/npm/ng-interconnect/)

`npm install ng-interconnect`

`import {Interconnect} from 'ng-interconnect'`


# API

The API exposes the connectivity for 3 use cases.

- Broadcasting messages from one point to many
- Listening messages from many points
- Create a promise in one component and resolve it from another
&nbsp;
&nbsp;
&nbsp;

## Creating a Broadcaster and receiving from it


### Example

```
 let messageStream: IMessageStream = createBroadcaster('home/stateChanged');   //Create a broadcaster```
 
 ...
 ...
 /*Receive from it from another component somewhere in the hierarchy*/
 
 let userReceiver = receiveFrom('home/stateChanged', 'contacts/user', (data, error, complete) => {
  console.log(data);
  console.log(error);
  console.log(complete);
 })
 
 
 '''
 '''
 /*Broadcast messages from the first component*/
 nessageStream.emit('logged-in');
 ```
&nbsp;
### Methods

`createBroadcaster(name: string)`

Creates a broadcaster and returns IMessageStream.

The returned IMessageStream object contains the following methods:

- `emit(data: any, options: any)` - Send data to all the recivers
- `error(error: any, options: any)` - Indicate an error in the underlaying process being broadcasted
- `complete(options: any)` - Indicates the completion of the broadcaster. Calling this method will terminate the broadcaster automatically

The `name` argument supports namespaces such as 'home/students/viewResults'
&nbsp;

**Options**

 ` matchNS: RegExp`   - A regular expression indicating the recivers whom the broadcasting should be limited to
  
  `myMessageStream.emit('saved', {matchNS: new RegExp('^user/next$')})`

&nbsp;
&nbsp;

#### To receive from the broadcaster

`receiveFrom(broadcasterName: string | string[], receiverName: string; callback);`

The callback will be called everytime the broadcaster sends a message to the receivers. It is possible to receive from multiple broadcasters if supplied an array of broadcasters.

The callback takes 4 arguments

- `data`  -- Contains data sent by the broadcaster when Emit happens. Contains `null` for other broadcast types.
- `error` -- Contains the error sent by the broadcaster when Error happens. Contain `null` for other broadcast types.
- `complete` -- Contains `true` when the Complete happens. Contains `null` for other broadcast types. 
- `broadcaster` -- Contains the name of the broadcaster who emited/error/complete. This is useful when receiving from multiple broadcasters

The method returns an array of receiver objects which contain the `disconnect` method. Calling this method will prevent receiving any events by the receiver any more.

#### Creating receivers for broadcasters which are not existing
One can also subscibe to a broadcast which is not yet created. In this case a promise will be returned. This promise will be resolved with an object with the `disconnect` method soon as the broadcaster becomes available.
 
&nbsp;
&nbsp;
&nbsp;
## Creating a Listener and connecting to it


### Example

```
 createListener('dataExpector', 'user', (connectionName, data, error, complete) => {
  console.log(`Data from: ${connectionName}`);
  console.log(data);
  console.log(error);
  console.log(complete);
 })


...
...
 /*Connect to it from another component somewhere in the hierarchy*/ 
 let messageStream: IMessageStream = connectToListener('dataExpector', 'fromUser');   //Create a broadcaster```
 
 messageStream.emit(some_user_data);   //Send a message to the listener
 ```
&nbsp;
### Methods

`createListener(listenerName: string, receiverName: string; callback);`

The callback will be called everytime a connection  sends a message to the listener. The callback takes 4 arguments

- connectionName -- The name of the connection which send the current message.
- data  -- Contains data sent via a connection by calling the Emit method. Contains `null`for other method calls.
- error -- Contains the error sent via a connection by calling the Error method. Contain `null` for other method calls.
- complete -- Contains `true` when sent via a connection by calling the Completye method. Contains `null` for other broadcast types. This method will terminate the listener.

&nbsp;
#### Connecting to the listener and sending a message

`connectToListener(listenerName: string, connectionName: string)`

The returned IMessageStream object contains the following methods:

- emit(data: any) - Send data to all the listener
- error(error: any) - Indicate an error in the underlaying process(es) being listened to.
- complete() - Indicates the completion of the listener. Calling this method will terminate the listener automatically.

The conneciton name should be a strig compatible with JS object key strings.

&nbsp;
#### Creating connections with the listeners which are not existing
**One can also connect to a listener which is not yet created.** In that case a promise will be returned. This promise will be resolved with a messageStream object soon as the listener becomes available.
 
 &nbsp;
 &nbsp;

## Getting debug info
The information about all the connectors and the connections can be obtained by calling the `info` method.

&nbsp;
&nbsp;

## Creating Notifiers

A notifier is one time alert of an event. 

`createNotifier(name: string): Promise<any>`

The returned promise would be fullfilled or rejected by the party who makes a notification on this notifier.

&nbsp;

## Issuing a notification

'notifiers(name: string)'

The `notifiers` method returns a notifier object matching the name. The notifier object contains the `notify(value: string)` and `error(string)` methods. Calling of either method would fullfill ort reject the promised returned when creating the notifier and delete it immeditately.

