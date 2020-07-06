# NgInterconnect

Makes it possible to shortcircuit the long and tedious angular event management across the tree of the component hierarchy.  Works across routes. The library contains the code and a sample demo app.

# Usage

[![NPM](https://nodei.co/npm/ng-interconnect.png?mini=true)](https://nodei.co/npm/ng-interconnect/)

Import `{Interconnect}` from the library


# API

The API exposes connectivity for 3 use cases.

- Broadcasting messages from one point to many
- Listening messages from many points
- Create a promise from one component to another


## Creating a Broadcaster and receiving from it


### Example

```
 let messageStream: IMessageStream = createBroadcaster('stateChanged');   //Create a broadcaster```
 
 ...
 ...
 /*Receive from it from another component somewhere in the hierarchy*/
 
 let userReceiver = receiveFrom('stateChanged', 'user', (data, error, complete) => {
  console.log(data);
  console.log(error);
  console.log(complete);
 })
 
 
 '''
 '''
 /*Broadcast messages from the first component*/
 nessageStream.emit('logged-in');
 ```
 
### Methods

`createBroadcaster(name: string)`

The returned IMessageStream object contains the following methods:

- emit(data: any) - Send data to all the recivers
- error(error: any) - Indicate an error in the underlaying process being broadcasted
- complete() - Indicates the completion of the broadcaster. Calling this method will terminate the broadcaster automatically

The connector name should be a strig compatible with JS object key strings.


To receive from the broadcaster, 

`receiveFrom(broadcasterName: string, receiverName: string; callback);`

The callback will be called everytime the broadcaster sends a message to the receivers. The callback takes 3 arguments

- data  -- Contains data sent by the broadcaster when Emit happens. Contains `null` for other broadcast types.
- error -- Contains the error sent by the broadcaster when Error happens. Contain `null` for other broadcast types.
- complete -- Contains `true` when the Complete happens. Contains `null` for other broadcast types.

The method returns the receiver object which contains the `unsubscribe` method. Calling this method will prevent receiving any events by the receiver.


 

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
 
### Methods

`createBroadcaster(name: string)`

The returned IMessageStream object contains the following methods:

- emit(data: any) - Send data to all the recivers
- error(error: any) - Indicate an error in the underlaying process being broadcasted
- complete() - Indicates the completion of the broadcaster. Calling this method will terminate the broadcaster automatically

The connector name should be a strig compatible with JS object key strings.


To receive from the broadcaster, 

`receiveFrom(broadcasterName: string, receiverName: string; callback);`

The callback will be called everytime the broadcaster sends a message to the receivers. The callback takes 3 arguments

- data  -- Contains data sent by the broadcaster when Emit happens. Contains `null` for other broadcast types.
- error -- Contains the error sent by the broadcaster when Error happens. Contain `null` for other broadcast types.
- complete -- Contains `true` when the Complete happens. Contains `null` for other broadcast types.

The method returns the receiver object which contains the `unsubscribe` method. Calling this method will prevent receiving any events by the receiver.


 

## Getting debug info
The information about all the connectors and the connections can be obtained by calling the `info` method.



## Creating Notifiers

A notifier is one time alert of an event. 

`createNotifier(name: string): Promise<any>`

The returned promise would be fullfilled or rejected by the party who makes a notification on this notifier.


## Issuing a notification

'notifiers(name: string)'

The `notifiers` method returns a notifier object matching the name. The notifier object contains the `notify(value: string)` and `error(string)` methods. Calling of either method would fullfill ort reject the promised returned when creating the notifier and delete it immeditately.

