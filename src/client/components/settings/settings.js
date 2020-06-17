import React from "react";
import { useHistory } from "react-router-dom";
import GamePage from "../game-page/game-page";
import "./settings.scss";


const Settings = () => {
    const history = useHistory();

    const routeChange = () => {
        let path = `/game-page`;
        history.push(path);
    };
    return (
        <>
            <GamePage />
            <div className="container">
                <div className={"settings"}>
                    <h1>{"Settings"}
                        <i
                            className={"fas fa-times closePage"}
                            onClick={routeChange}
                        />
                    </h1>
                    <i className={"fas fa-user-circle"} />
                    <div className={"info"}>
                        <p>
                            <i className={"fas fa-tree"} /> {"12 Trees"}
                        </p>
                        <p>
                            <i className={"fas fa-leaf"} /> {"300 Leafs"}
                        </p>
                    </div>
                    <form>
                        <h2>{"Username"}</h2>
                        <input placeholder={"Bg pro react 4000"} />
                        <h2>{"Password"}</h2>
                        <input />
                        <button type={"submit"}>{"Save changes"}</button>
                    </form>
                </div>
            </div>
        </>
    );
};
export default Settings;
