module.exports = {
    '*.{js,jsx,ts,tsx,json,md}': (files) => {
        const filtered = files.filter((f) => !/[\\/](dist|build)[\\/]/.test(f))
        return filtered.length ? [`eslint --fix ${filtered.map((f) => `"${f}"`).join(' ')}`] : []
    }
}
