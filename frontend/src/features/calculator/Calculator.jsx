import { useState, useCallback } from "react";
import WindowControls from "@components/common/WindowControl.jsx";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import "@style/calculator.css";

const BUTTONS = [
    ["AC", "+/-", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
];

function Calculator() {
    const [display, setDisplay] = useState("0");
    const [prevValue, setPrevValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [expression, setExpression] = useState("");

    const calculate = useCallback((a, b, op) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        switch (op) {
            case "+": return numA + numB;
            case "−": return numA - numB;
            case "×": return numA * numB;
            case "÷": return numB !== 0 ? numA / numB : "Error";
            default: return numB;
        }
    }, []);

    const formatNumber = (num) => {
        if (num === "Error") return "Error";
        const str = String(num);
        if (str.includes(".") && str.split(".")[1].length > 8) {
            return parseFloat(num.toFixed(8)).toString();
        }
        return str;
    };

    const handleButton = useCallback((btn) => {
        if (btn === "AC") {
            setDisplay("0");
            setPrevValue(null);
            setOperator(null);
            setWaitingForOperand(false);
            setExpression("");
            return;
        }

        if (btn === "+/-") {
            setDisplay(prev => formatNumber(parseFloat(prev) * -1));
            return;
        }

        if (btn === "%") {
            setDisplay(prev => formatNumber(parseFloat(prev) / 100));
            return;
        }

        if (["+", "−", "×", "÷"].includes(btn)) {
            if (operator && !waitingForOperand) {
                const result = calculate(prevValue, display, operator);
                const formatted = formatNumber(result);
                setDisplay(formatted);
                setPrevValue(formatted);
                setExpression(`${formatted} ${btn}`);
            } else {
                setPrevValue(display);
                setExpression(`${display} ${btn}`);
            }
            setOperator(btn);
            setWaitingForOperand(true);
            return;
        }

        if (btn === "=") {
            if (operator && prevValue !== null) {
                const result = calculate(prevValue, display, operator);
                const formatted = formatNumber(result);
                setExpression(`${prevValue} ${operator} ${display} =`);
                setDisplay(formatted);
                setPrevValue(null);
                setOperator(null);
                setWaitingForOperand(false);
            }
            return;
        }

        if (waitingForOperand) {
            if (btn === ".") {
                setDisplay("0.");
            } else {
                setDisplay(btn);
            }
            setWaitingForOperand(false);
            return;
        }

        setDisplay(prev => {
            if (btn === ".") {
                if (prev.includes(".")) return prev;
                return prev + ".";
            }
            if (prev === "0") return btn;
            if (prev === "Error") return btn;
            if (prev.length >= 12) return prev;
            return prev + btn;
        });
    }, [display, prevValue, operator, waitingForOperand, calculate]);

    const getButtonClass = (btn) => {
        if (btn === "AC" || btn === "+/-" || btn === "%") return "calc-btn calc-btn-light";
        if (["+", "−", "×", "÷", "="].includes(btn)) return "calc-btn calc-btn-orange";
        if (btn === "0") return "calc-btn calc-btn-dark calc-btn-zero";
        return "calc-btn calc-btn-dark";
    };

    const displayFontSize = display.length > 9 ? "1.8rem" : display.length > 6 ? "2.4rem" : "3rem";

    return (
        <div className="calc-container">
            <div id="window-header" className="calc-header">
                <WindowControls target="calculator" />
                <span className="calc-title">Calculator</span>
                <div style={{ width: 52 }} />
            </div>

            {/* Display */}
            <div className="calc-display">
                <div className="calc-expression">{expression}</div>
                <div className="calc-result" style={{ fontSize: displayFontSize }}>
                    {display}
                </div>
            </div>

            {/* Buttons */}
            <div className="calc-buttons">
                {BUTTONS.map((row, ri) => (
                    <div key={ri} className="calc-row">
                        {row.map((btn) => (
                            <button
                                key={btn}
                                className={getButtonClass(btn)}
                                onClick={() => handleButton(btn)}
                                id={`calc-btn-${btn.replace(/[^a-zA-Z0-9]/g, "")}`}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

const CalculatorWindow = WindowWrapper(Calculator, "calculator");
export default CalculatorWindow;
