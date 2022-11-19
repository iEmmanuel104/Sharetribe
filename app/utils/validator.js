const db = require("../../models");
const User = db.User;

const validate = () => {
    const isAdminEmail = (Adminemail) => User.findOne({where: {email: Adminemail}})
    const isHostEmail = Hostemail => User.findOne({where:{Hostemail}})


    return {
        isAdminEmail,
        isHostEmail
    }
}

module.exports = validate