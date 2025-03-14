import { Link } from "react-router-dom"

const NavBar = () => {
    return (
        <nav>
            <ul className="w-full flex flex-row gap-1 justify-end">
                <li><Link to="/">Home</Link> </li>
                <li><Link to="/about">About</Link></li>
            </ul>
        </nav>
    )
}

export default NavBar;