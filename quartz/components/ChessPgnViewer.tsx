// @ts-ignore
import script from "./scripts/chessPgnViewer.inline"
import styles from "./styles/chessPgnViewer.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const ChessPgnViewer: QuartzComponent = () => {
  return null
}

ChessPgnViewer.afterDOMLoaded = script
ChessPgnViewer.css = styles

export default (() => ChessPgnViewer) satisfies QuartzComponentConstructor
