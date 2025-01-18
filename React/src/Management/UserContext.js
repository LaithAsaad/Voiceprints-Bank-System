import { createContext, useState, useContext } from "react";

export const User = createContext({});

export default function UserProvidor({ children }) {
    const [auth, setAuth] = useState({
        accessToken: null,
        refreshToken: null,
        isAdmin: null,
    });

    return (
        <User.Provider value={{ auth, setAuth }}>{children}</User.Provider>
    )
}