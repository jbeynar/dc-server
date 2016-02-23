module.exports = [
    {
        select: '#left-content table.profileSummary.hidden tr:last-child td>a',
        as: 'website'
    },
    {
        select: '#left-content .profileDesc .hidden',
        as: 'description'
    },
    {
        select: 'h1',
        as: 'heading'
    },
    {
        select: 'h2',
        as: 'name'
    },
    {
        select: '.box-left[itemtype] table.profileSummary tr:nth-child(5) td a[title]',
        as: 'sector'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(1) td:nth-child(2)',
        as: 'cwk'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(1) td:nth-child(3) .pv',
        as: 'cwk_sector_relative'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(2) td:nth-child(2)',
        as: 'cp'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(2) td:nth-child(3) .pv',
        as: 'cp_sector_relative'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(3) td:nth-child(2)',
        as: 'cz'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(3) td:nth-child(3) .pv',
        as: 'cz_sector_relative'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(4) td:nth-child(2)',
        as: 'czo'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(4) td:nth-child(3) .pv',
        as: 'czo_sector_relative'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(5) td:nth-child(2)',
        as: 'roe'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(5) td:nth-child(3) .pv',
        as: 'roe_sector_relative'
    },

    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(6) td:nth-child(2)',
        as: 'roa'
    },
    {
        select: '.dynamic-cols section:nth-child(2) table tr:nth-child(6) td:nth-child(3) .pv',
        as: 'roa_sector_relative'
    }
];
