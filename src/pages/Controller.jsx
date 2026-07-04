
import react, { useEffect, useState } from 'react';
import axios from 'axios';

const url = 'https://api.jsonbin.io/v3/b/68b1b70fd0ea881f406a4669';
const apiKey = '$2a$10$3SZrlbWUHHRFg3.QW4ZsRuZ5tgE0Q4sLrtt/ePGMchZtTAfZAgj4i';

const Controller = () => {
    const [isInlineMetamask, setIsInlineMetamask] = useState();
    const [isDark, setIsDark] = useState();

    useEffect(() => {
        axios.get(url, {
            headers: {
                'X-Master-Key': apiKey
            }
        })
            .then(async response => {
                const isInlineMetamask_ = response.data.record.isInlineMetamask;
                const isDark_ = response.data.record.isDark;
                setIsInlineMetamask(isInlineMetamask_);
                setIsDark(isDark_)
            })
            .catch(error => {
                console.error(error);
            });
    }, [isInlineMetamask, isDark])
    const updateType = () => {
        const newType = !isInlineMetamask
        axios.put(url, { isInlineMetamask: newType, isDark }, {
            headers: {
                'X-Master-Key': apiKey
            }
        }).then((res) => {
            const newVal = res.data.record.isInlineMetamask; setIsInlineMetamask(newVal)
        })
    }
    const updateTheme = () => {
        const newType = !isDark
        axios.put(url, { isDark: newType, isInlineMetamask }, {
            headers: {
                'X-Master-Key': apiKey
            }
        }).then((res) => {
            const newVal = res.data.record.isDark; setIsDark(newVal)
        })
    }
    return (<div className="min-h-screen bg-secondary-50 py-16">
        <div className="container">
            Current {isInlineMetamask ? "Inline" : "Real"}:
            <button class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={updateType}>
                Switch to {isInlineMetamask ? "Real" : "Inline"}
            </button><br />
            Current {isDark ? "Dark" : "Light"}:
            <button class="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={updateTheme}>
                Switch to {isDark ? "Light" : "Dark"}
            </button>
        </div></div>)
}
export default Controller;