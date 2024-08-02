import {createContext,useEffect,useState} from "react";
import axios from "axios";
export const UserContext=createContext({});//createContext creates a new context object.This object contains two components:Provider,Consumer

export function UserContextProvider({children})//children refers to the components nested within MyContextProvider.
{
    const [user,setUser]=useState(null);
    const [ready,setReady]=useState(false);
    useEffect(()=>{
        if(!user)
            {
                axios.get("/profile").then(({data})=>{
                    setUser(data);
                    setReady(true);
                });
               
            }
    },[]);
    return(
        <UserContext.Provider value={{user,setUser,ready}}>
            {children}
        </UserContext.Provider>
    );
}
