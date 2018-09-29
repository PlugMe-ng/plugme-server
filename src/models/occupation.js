import capitalize from 'capitalize';

module.exports = (sequelize, DataTypes) => {
  const occupation = sequelize.define('occupation', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // set(value) {
      //   this.setDataValue('title', value.toLowerCase());
      // },
      // get() {
      //   const title = this.getDataValue('title');
      //   return capitalize.words(title);
      // }
    },
  }, {});
  occupation.associate = (models) => {

  };
  return occupation;
};
