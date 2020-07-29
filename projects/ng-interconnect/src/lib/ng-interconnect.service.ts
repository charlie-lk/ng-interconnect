import { Injectable, EventEmitter } from '@angular/core';
import { Observable, ObjectUnsubscribedError } from 'rxjs';
import { Event } from '@angular/router';
import { resolve } from 'q';


export interface IMessageStream {
  emit: any,
  error: any,
  complete: any
}

interface IBroadcaster {
  observable: Observable<any>,
  broadcasterObject: IMessageStream,
  info: any
}

interface INotifier {
  notify: any,
  error: any
}

interface IObserverClient {
  observer: any,
  clientName: string
}

interface IWaitingReceiver {
  name: string;
  callback: any;
  subscriptionResolver: any;
}

interface IWaitingConnection {
  name: string,
  messageStreamResolver: any
}


interface IListener {
  event: EventEmitter<any>;
  subscription: any;
}


@Injectable({
  providedIn: 'root'
})
export class Interconnect {

  private _broadcasters: { [key: string]: IBroadcaster } = {};
  private _notifiers: {} = {};
  private _listeners: {[key: string]: IListener} = {};

  private _waitingReceivers: {[key: string]: IWaitingReceiver[]} = {};
  private _waitingConnections: {[key: string]: IWaitingConnection[]} = {};

  private currentReceiverName: string = '';
  private currentConnectionName: string = '';


  constructor() { }

  //Broadcaster --------
  public createBroadcaster(broadcasterName: string): IMessageStream {

    //Convert the name to a property name
    broadcasterName = this.strToPropName(broadcasterName);

    if (this._broadcasters[broadcasterName])
      return this._broadcasters[broadcasterName].broadcasterObject;

    //A new Broadcaster
    this._broadcasters[broadcasterName] = <IBroadcaster> {};

    //Create the subscriber function and the event
    let subscriberPackage = this.subscriberFactory(broadcasterName);

    this._broadcasters[broadcasterName].observable = new Observable(subscriberPackage.subscriberFn);
    this._broadcasters[broadcasterName].info = subscriberPackage.info;

    //Wrap the event emitter so, the messaging can be further customized
    this._broadcasters[broadcasterName].broadcasterObject =  {

      emit: (data, options?) => subscriberPackage.event.emit({data, options}),
      error: (error, options?) => subscriberPackage.event.error({error, options}),
      complete: () => subscriberPackage.event.complete()
    }


    //Add all the waiting receivers
    if (this._waitingReceivers[broadcasterName])
      this._waitingReceivers[broadcasterName].forEach((waitingReceiver) => {
        let unsubscriberObj = this.receiveFrom(this.propNameToStr(broadcasterName), this.propNameToStr(waitingReceiver.name), waitingReceiver.callback);

        waitingReceiver.subscriptionResolver(unsubscriberObj);  //Resolve the prmose with
      })

    return this._broadcasters[broadcasterName].broadcasterObject;
  }

  public receiveFrom(broadcaster: string | string[], receiverName: string, callback: any): Promise<any> | any {


    //Manage the first parameter for being a string or an array. -----
    //Convert it to an array
    let broadcasterNames = [];

    if (typeof broadcaster === 'string')
      broadcasterNames.push(broadcaster);

    if (broadcaster instanceof Array)
      broadcasterNames = broadcaster;
    //---------------
    

    //Create all broadcasters ----
    let retObj = [];

    for (let broadcasterName of broadcasterNames){

      //Convert names to property names
      broadcasterName = this.strToPropName(broadcasterName);
      receiverName = this.strToPropName(receiverName);


      //Put in the waiting list if the named broadcaster is absent
      if (!this._broadcasters[broadcasterName]){

        let subscriptionResolver;
        
        //Promise to return to the user. This will be resolved with the unsubscriber object soon as the Broadcaster appears
        let subscriptionPromise = new Promise((resolve) => {
          subscriptionResolver = resolve;
        });


        if (!this._waitingReceivers[broadcasterName])
          this._waitingReceivers[broadcasterName] = [];

        this._waitingReceivers[broadcasterName].push({
          name: receiverName,
          callback,
          subscriptionResolver
        })

        retObj.push({
          broadcaster: this.propNameToStr(broadcasterName),
          subscriptionPromise: subscriptionPromise
        })

        continue;
        
      } 
      else
        var connector = this._broadcasters[broadcasterName];


      this.currentReceiverName = receiverName;
      let classContext = this;

      var subscription = connector.observable.subscribe({
        next(e) {
          callback(e, null, null, classContext.propNameToStr(broadcasterName))
        },

        error(e) {
          callback(null, e, null, classContext.propNameToStr(broadcasterName))
        },

        complete() {
          callback(null, null, true, classContext.propNameToStr(broadcasterName));
        }

      })

      retObj.push({
        broadcaster: this.propNameToStr(broadcasterName),
        disconnect: function() {
          subscription.unsubscribe()
        }
      })

    }


    return retObj;


  }

  public info() {

    let ret = {};

    for (let [key, value] of Object.entries(this._broadcasters))
      ret[key] = {
          name: this.propNameToStr(key),
          receivers: value.info()
      }

    return ret;
 
  }

  //Notifier --------
  public createNotifier(name: string) {

    if (!name)
      return "Invalid notifier name";

    name = this.strToPropName(name)


    //Return the promise if the notifier is already available
    if (this._notifiers[name])
      return this._notifiers[name].promise;


    let notifierPackage = this.createNotifierPackage(true, name);

    this._notifiers[name] = notifierPackage;

    return notifierPackage.promise;
  }

  public notifiers(name: string): INotifier {

    name = this.strToPropName(name);

    //Create the notifier if it is not found
    if (!this._notifiers[name]) {
      var notifierPackage = this.createNotifierPackage(false, '');
      
      this._notifiers[name] = notifierPackage;
    }


    return this._notifiers[name].notifierObject;
  }


  //Listener-----
  public createListener(listenerName: string, callback: any) {
    
    listenerName = this.strToPropName(listenerName)
    let event: EventEmitter<any>;

    //Retreive the event and replace the subscription for existing listeners
    if (this._listeners[listenerName]){

      this._listeners[listenerName].subscription.unsubscribe();
      event = this._listeners[listenerName].event;  
    }
    else
      event = new EventEmitter();



    let classContext = this;

    let subscription = event.subscribe({

      next(data){ 
        callback(data.connectionName, data.data, null, null); 
      },

      error(error) {
        callback(error.connectionName, null, error.error, null);
      },

      complete() {
        callback(classContext.currentConnectionName , null, null, true);
        delete classContext._listeners[name];
      }

    })


    //Add the listener
    this._listeners[listenerName] = {event, subscription}


    //Add all the waiting connections
    if (this._waitingConnections[listenerName])
      this._waitingConnections[listenerName].forEach((connection) => {
        
        //Obtain the messageStremObject
        let messageStream = this.connectToListener(this.propNameToStr(listenerName), connection.name);

        //Resolve the promises with that
        connection.messageStreamResolver(messageStream);
      })

 
  }

  public connectToListener(listenerName: string, connectionName:string): IMessageStream | Promise<IMessageStream>{

    if (typeof connectionName !== 'string')
      throw 'Invalid connection name';

    listenerName = this.strToPropName(listenerName);

    //Put in the waiting connections list
    if (!this._listeners[listenerName]){

      let messageStreamResolver;
      
      //Promise to return to the user. This will be resolved with the unsubscriber object soon as the Broadcaster appears
      let messageStreamPromise = new Promise<IMessageStream>((resolve) => {
        messageStreamResolver = resolve;
      });


      if (!this._waitingConnections[listenerName])
        this._waitingConnections[listenerName] = [];

      this._waitingConnections[listenerName].push({
        name: connectionName,
        messageStreamResolver
      })

      return messageStreamPromise;

    }
    

    let event: EventEmitter<any> = this._listeners[listenerName].event;
    
    let classContext = this;

    return {

      emit(data) {
        event.emit({connectionName, data})
      },

      error(error) {
        event.error({connectionName, error})
      },

      complete() {

        classContext.currentConnectionName = connectionName;
        event.complete()
        
      }
    }

  }



  //--------------------------- Helpers -------------------------//


  //Broadcaster helpers
  private subscriberFactory(broadcasterName: string) {

    //Factory to return a subscriber function with multicast support

    //All observers are saved here
    const observers: IObserverClient[] = [];

    const event: EventEmitter<any> = new EventEmitter();

    const classContext = this;

    let eventSubscribed: boolean = false; //To indicate the first subscriber has arrived and the event is subscribed


    const subscriberFn = function (observer) {

      //If this is the same client, remove the old observer
      for (let [i, observerClient] of observers.entries()) {
        if (observerClient.clientName === classContext.currentReceiverName){
          observers.splice(i, 1);
        }
      }

      observers.push({
        observer,
        clientName: classContext.currentReceiverName
      });



      //Subscribe to the event when the first observer appears
      if (!eventSubscribed) {

        eventSubscribed = true;
        classContext.handleEvents(event, 
          
          //next
          (e) => {            
            observers.forEach((observableClient) =>  {

              if (e.options && e.options.matchNS && e.options.matchNS instanceof RegExp)
                if (e.options.matchNS.test(classContext.propNameToStr(observableClient.clientName)))
                  observableClient.observer.next(e.data)
                else;
              else
                observableClient.observer.next(e.data)  
            });
          },

          //error
          (e) => {
            observers.forEach((observableClient) =>  {

              if (e.options && e.options.matchNS && e.options.matchNS instanceof RegExp)
                if (e.options.matchNS.test(observableClient.clientName))
                  observableClient.observer.error(e.error)
                else;
              else
                observableClient.observer.error(e.error)  
            });      
          },

          //complete
          () => {
            observers.forEach((observableClient) =>  {
              observableClient.observer.complete();
              observableClient.observer.unsubscribe();
            });

            observers.length = 0;

            classContext._broadcasters[broadcasterName].observable = null;
            delete classContext._broadcasters[broadcasterName];
          }
          
        )

      }

      return {
        unsubscribe() {

          for (let [i, observableClient] of observers.entries())
            if (observableClient.observer === observer)
              observers.splice(i, 1);
        } 
      }

    }    


    return {event, subscriberFn, info: () => {
      return observers.map((observer) => this.propNameToStr(observer.clientName));
    }};
  }


  private handleEvents(event: EventEmitter<any>, next: any, error: any, complete: any) {


    event.subscribe(

      //next
      (e) => {
        next(e);
      },

      //error
      (e) => {
        error(e);
      },

      //complete
      (e) => {
        complete(e);
      }


    )

  }


  private createNotifierPackage(deleteAfterAction, name) {

    let notifierObject;
    let classContext = this;

    let promise = new Promise((resolve, reject) => {

      notifierObject = {

        notify(data) { 

          resolve(data); 

          if (deleteAfterAction)
            delete classContext._notifiers[name];

        },

        error(err) { 

          reject(err)

          if (deleteAfterAction)
            delete classContext._notifiers[name];
        }
      }
    })


    return { promise, notifierObject }

  }

  private strToPropName(str:  string): string {
    return Array.from(str).reduce((a, c) => {
      return a + c.charCodeAt(0).toString().padStart(3, '0')
    }, '');
  }

  private propNameToStr(str: string): string {
    
    let charCodes = [];
    for (let i=0; i<str.length; i=i+3) {
      charCodes.push(str.substring(i, i + 3));
    } 

    return String.fromCharCode.apply(null, charCodes);
  }


  


}
