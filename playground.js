// ['Basketry', 'Weaving', 'Sculpting', 'Pottery', 'Figurines', 'Bronze Work'].forEach((element) => { models.minorTag.create({ title: element }).then((tag) => { tag.setCategory('b8750819-6032-4386-a67e-80a4d54b273b'); }); });
// 'Graphic Design, Architectural Design, Interior Design, Design Engineering'.split(', ').forEach((element) => { models.minorTag.create({ title: element }).then((tag) => { tag.setCategory('1bfedd35-ea05-44da-82c3-b86764390020'); }); });
// ['Art', 'Technology', 'Handicraft', 'Fashion', 'Design', 'Audio-Visuals', 'Photography'].forEach((element) => { models.majorTag.create({ title: element }); });

